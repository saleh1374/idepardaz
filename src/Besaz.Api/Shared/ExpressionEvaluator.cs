using System.Globalization;

namespace Besaz.Api.Shared;

/// <summary>
/// ارزیاب عبارت ساده برای فرمول‌های پارامتریک (qtyFormula و affects).
/// پشتیبانی: اعداد، رشته‌ها ('...'), true/false, متغیرها، عملگرهای + - * / % == != &lt; &gt; &lt;= &gt;= &amp;&amp; || !
/// سه‌تایی ?: و توابع ceil/floor/round/min/max.
/// کاربرد: فرمول‌هایی مثل ceil(capacityMah / 3000) یا includeSwitch == true ? 1 : 0
/// </summary>
public static class ExpressionEvaluator
{
    public static object? Evaluate(string expression, IReadOnlyDictionary<string, object?> variables)
    {
        if (string.IsNullOrWhiteSpace(expression))
            return null;
        var parser = new Parser(expression, variables);
        var value = parser.ParseTop();
        return value;
    }

    /// <summary>ارزیابی که خروجی باید عدد باشد (برای تعداد قطعات).</summary>
    public static double EvaluateNumber(string expression, IReadOnlyDictionary<string, object?> variables)
    {
        var value = Evaluate(expression, variables);
        return ToNumber(value, expression);
    }

    private static double ToNumber(object? v, string source)
    {
        switch (v)
        {
            case double d: return d;
            case int i: return i;
            case long l: return l;
            case bool b: return b ? 1 : 0;
            case string s when double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out var d): return d;
            default:
                throw new InvalidOperationException($"عبارت «{source}» عدد معتبر برنگرداند (مقدار: {v ?? "null"}).");
        }
    }

    private static bool Truthy(object? v) => v switch
    {
        null => false,
        bool b => b,
        double d => d != 0,
        int i => i != 0,
        long l => l != 0,
        string s => !string.IsNullOrEmpty(s),
        _ => true,
    };

    private static bool ValueEquals(object? a, object? b)
    {
        var (na, nb) = (NumValue(a), NumValue(b));
        if (na is not null && nb is not null) return na.Value == nb.Value;
        if (a is bool ba && b is bool bb) return ba == bb;
        return Convert.ToString(a, CultureInfo.InvariantCulture) == Convert.ToString(b, CultureInfo.InvariantCulture);
    }

    private static double? NumValue(object? v) => v switch
    {
        double d => d,
        int i => i,
        long l => l,
        bool b => b ? 1 : 0,
        string s when double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out var d) => d,
        _ => null,
    };

    private sealed class Parser
    {
        private readonly string _src;
        private readonly IReadOnlyDictionary<string, object?> _vars;
        private readonly List<Token> _tokens = new();
        private int _pos;

        public Parser(string src, IReadOnlyDictionary<string, object?> vars)
        {
            _src = src;
            _vars = vars;
            Tokenize();
        }

        public object? ParseTop()
        {
            var value = ParseTernary();
            if (Current.Type != TokenType.End)
                throw new InvalidOperationException($"کاراکتر غیرمنتظره در عبارت «{_src}»: «{Current.Text}».");
            return value;
        }

        // ---- پیش‌زمینه‌های دستوری ----

        private object? ParseTernary()
        {
            var cond = ParseOr();
            if (Match(TokenType.Question))
            {
                var whenTrue = ParseTernary();
                Expect(TokenType.Colon);
                var whenFalse = ParseTernary();
                return Truthy(cond) ? whenTrue : whenFalse;
            }
            return cond;
        }

        private object? ParseOr()
        {
            var left = ParseAnd();
            while (MatchOperator("||"))
            {
                var right = ParseAnd();
                left = Truthy(left) || Truthy(right);
            }
            return left;
        }

        private object? ParseAnd()
        {
            var left = ParseEquality();
            while (MatchOperator("&&"))
            {
                var right = ParseEquality();
                left = Truthy(left) && Truthy(right);
            }
            return left;
        }

        private object? ParseEquality()
        {
            var left = ParseComparison();
            while (true)
            {
                if (MatchOperator("==")) { left = ValueEquals(left, ParseComparison()); }
                else if (MatchOperator("!=")) { left = !ValueEquals(left, ParseComparison()); }
                else return left;
            }
        }

        private object? ParseComparison()
        {
            var left = ParseAdditive();
            while (true)
            {
                if (MatchOperator("<")) { left = Compare(left, ParseAdditive()) < 0; }
                else if (MatchOperator("<=")) { left = Compare(left, ParseAdditive()) <= 0; }
                else if (MatchOperator(">")) { left = Compare(left, ParseAdditive()) > 0; }
                else if (MatchOperator(">=")) { left = Compare(left, ParseAdditive()) >= 0; }
                else return left;
            }
        }

        private double Compare(object? a, object? b) => ToNumber(a, _src).CompareTo(ToNumber(b, _src));

        private object? ParseAdditive()
        {
            var left = ParseMultiplicative();
            while (true)
            {
                if (MatchOperator("+"))
                {
                    var right = ParseMultiplicative();
                    // جمع رشته‌ای
                    if (left is string ls || right is string rs)
                        left = Convert.ToString(left, CultureInfo.InvariantCulture) + Convert.ToString(right, CultureInfo.InvariantCulture);
                    else
                        left = ToNumber(left, _src) + ToNumber(right, _src);
                }
                else if (MatchOperator("-"))
                {
                    left = ToNumber(left, _src) - ToNumber(ParseMultiplicative(), _src);
                }
                else return left;
            }
        }

        private object? ParseMultiplicative()
        {
            var left = ParseUnary();
            while (true)
            {
                if (MatchOperator("*")) { left = ToNumber(left, _src) * ToNumber(ParseUnary(), _src); }
                else if (MatchOperator("/")) { left = ToNumber(left, _src) / ToNumber(ParseUnary(), _src); }
                else if (MatchOperator("%")) { left = ToNumber(left, _src) % ToNumber(ParseUnary(), _src); }
                else return left;
            }
        }

        private object? ParseUnary()
        {
            if (MatchOperator("!")) return !Truthy(ParseUnary());
            if (MatchOperator("-")) return -ToNumber(ParseUnary(), _src);
            return ParsePrimary();
        }

        private object? ParsePrimary()
        {
            var tok = Current;
            switch (tok.Type)
            {
                case TokenType.Number:
                    Advance();
                    return double.Parse(tok.Text, CultureInfo.InvariantCulture);
                case TokenType.String:
                    Advance();
                    return tok.Text;
                case TokenType.True:
                    Advance();
                    return true;
                case TokenType.False:
                    Advance();
                    return false;
                case TokenType.Identifier:
                    Advance();
                    if (tok.Text is "ceil" or "floor" or "round" or "min" or "max")
                        return CallFunction(tok.Text);
                    if (_vars.TryGetValue(tok.Text, out var value))
                        return value;
                    throw new InvalidOperationException($"متغیر ناشناخته «{tok.Text}» در عبارت «{_src}».");
                case TokenType.LParen:
                {
                    Advance();
                    var inner = ParseTernary();
                    Expect(TokenType.RParen);
                    return inner;
                }
                default:
                    throw new InvalidOperationException($"قسمت غیرمنتظره در عبارت «{_src}»: «{tok.Text}».");
            }
        }

        private object? CallFunction(string name)
        {
            Expect(TokenType.LParen);
            var args = new List<object?>();
            if (Current.Type != TokenType.RParen)
            {
                args.Add(ParseTernary());
                while (Match(TokenType.Comma))
                    args.Add(ParseTernary());
            }
            Expect(TokenType.RParen);
            return name switch
            {
                "ceil" => Math.Ceiling(ToNumber(args.Count > 0 ? args[0] : null, _src)),
                "floor" => Math.Floor(ToNumber(args.Count > 0 ? args[0] : null, _src)),
                "round" => Math.Round(ToNumber(args.Count > 0 ? args[0] : null, _src)),
                "min" => args.Count > 0 ? args.Select(a => ToNumber(a, _src)).Min() : 0,
                "max" => args.Count > 0 ? args.Select(a => ToNumber(a, _src)).Max() : 0,
                _ => 0,
            };
        }

        // ---- توکنیزه‌کردن ----

        private enum TokenType { Number, String, Identifier, Operator, LParen, RParen, Question, Colon, Comma, True, False, End }

        private readonly record struct Token(TokenType Type, string Text, int Pos);

        private Token Current => _tokens[_pos];

        private void Advance() => _pos++;

        private bool Match(TokenType type)
        {
            if (Current.Type != type) return false;
            Advance();
            return true;
        }

        private bool MatchOperator(string op)
        {
            if (Current.Type != TokenType.Operator || Current.Text != op) return false;
            Advance();
            return true;
        }

        private void Expect(TokenType type)
        {
            if (!Match(type))
                throw new InvalidOperationException($"در عبارت «{_src}» انتظار «{type}» می‌رفت اما «{Current.Text}» آمد.");
        }

        private void Tokenize()
        {
            var i = 0;
            while (i < _src.Length)
            {
                var c = _src[i];
                if (char.IsWhiteSpace(c)) { i++; continue; }

                if (char.IsDigit(c))
                {
                    var start = i;
                    while (i < _src.Length && (char.IsDigit(_src[i]) || _src[i] == '.')) i++;
                    _tokens.Add(new Token(TokenType.Number, _src[start..i], start));
                    continue;
                }

                if (char.IsLetter(c) || c == '_')
                {
                    var start = i;
                    while (i < _src.Length && (char.IsLetterOrDigit(_src[i]) || _src[i] == '_')) i++;
                    var text = _src[start..i];
                    _tokens.Add(text switch
                    {
                        "true" => new Token(TokenType.True, text, start),
                        "false" => new Token(TokenType.False, text, start),
                        _ => new Token(TokenType.Identifier, text, start),
                    });
                    continue;
                }

                if (c is '\'' or '"')
                {
                    var quote = c;
                    var start = i;
                    i++;
                    var sb = new System.Text.StringBuilder();
                    while (i < _src.Length && _src[i] != quote)
                    {
                        if (_src[i] == '\\' && i + 1 < _src.Length)
                        {
                            i++;
                            sb.Append(_src[i]);
                        }
                        else sb.Append(_src[i]);
                        i++;
                    }
                    if (i >= _src.Length)
                        throw new InvalidOperationException($"رشتهٔ باز در عبارت «{_src}».");
                    i++; // quote بسته
                    _tokens.Add(new Token(TokenType.String, sb.ToString(), start));
                    continue;
                }

                var two = i + 1 < _src.Length ? _src.Substring(i, 2) : "";
                switch (two)
                {
                    case "==": _tokens.Add(new Token(TokenType.Operator, "==", i)); i += 2; continue;
                    case "!=": _tokens.Add(new Token(TokenType.Operator, "!=", i)); i += 2; continue;
                    case "<=": _tokens.Add(new Token(TokenType.Operator, "<=", i)); i += 2; continue;
                    case ">=": _tokens.Add(new Token(TokenType.Operator, ">=", i)); i += 2; continue;
                    case "&&": _tokens.Add(new Token(TokenType.Operator, "&&", i)); i += 2; continue;
                    case "||": _tokens.Add(new Token(TokenType.Operator, "||", i)); i += 2; continue;
                }

                switch (c)
                {
                    case '+': case '-': case '*': case '/': case '%': case '<': case '>': case '!':
                        _tokens.Add(new Token(TokenType.Operator, c.ToString(), i)); i++; continue;
                    case '(': _tokens.Add(new Token(TokenType.LParen, "(", i)); i++; continue;
                    case ')': _tokens.Add(new Token(TokenType.RParen, ")", i)); i++; continue;
                    case '?': _tokens.Add(new Token(TokenType.Question, "?", i)); i++; continue;
                    case ':': _tokens.Add(new Token(TokenType.Colon, ":", i)); i++; continue;
                    case ',': _tokens.Add(new Token(TokenType.Comma, ",", i)); i++; continue;
                    default:
                        throw new InvalidOperationException($"کاراکتر نامعتبر «{c}» در عبارت «{_src}».");
                }
            }
            _tokens.Add(new Token(TokenType.End, "", _src.Length));
        }
    }
}
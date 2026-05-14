from lark import Lark, Transformer, v_args
import structlog

logger = structlog.get_logger()

# Grammer for SentinelX SIEM Query Language (SXQL)
# Supports: field=value, field!=value, field>value, field<value, field:pattern, AND, OR, NOT, (groups)
SXQL_GRAMMAR = r"""
    ?start: piped_expression
    
    ?piped_expression: expression ( "|" command )*

    ?command: stats_command
    
    ?stats_command: "stats " CNAME " by " CNAME -> stats_op

    ?expression: or_expr

    ?or_expr: and_expr
            | or_expr " OR " and_expr   -> or_op

    ?and_expr: term
             | and_expr " AND " term     -> and_op
             | and_expr " " term          -> and_op

    ?term: comparison
         | "(" expression ")"
         | "NOT " term                   -> not_op

    ?comparison: CNAME "=" VALUE         -> eq
               | CNAME "!=" VALUE        -> neq
               | CNAME ">" VALUE         -> gt
               | CNAME "<" VALUE         -> lt
               | CNAME ":" VALUE         -> like

    CNAME: /[a-zA-Z_][a-zA-Z0-9_.]*/
    VALUE: /"[^"]*"|'[^']*'|[^\s()]+/

    %import common.WS
    %ignore WS
"""

class SXQLTransformer(Transformer):
    def eq(self, args):
        field, val = args
        return f"{field} = {self._format_val(val)}"
    
    def neq(self, args):
        field, val = args
        return f"{field} != {self._format_val(val)}"

    def gt(self, args):
        field, val = args
        return f"{field} > {self._format_val(val)}"

    def lt(self, args):
        field, val = args
        return f"{field} < {self._format_val(val)}"

    def like(self, args):
        field, val = args
        # Convert :pattern to LIKE %pattern%
        v = val.strip('"').strip("'")
        return f"{field} ILIKE '%{v}%'"

    def stats_op(self, args):
        agg_func, group_field = args
        return {"type": "stats", "agg": agg_func, "by": group_field}

    def piped_expression(self, args):
        where = args[0]
        commands = args[1:]
        return {"where": where, "commands": commands}

    def or_op(self, args):
        return f"({args[0]} OR {args[1]})"

    def and_op(self, args):
        return f"({args[0]} AND {args[1]})"

    def not_op(self, args):
        return f"NOT ({args[0]})"

    def _format_val(self, val):
        v = str(val)
        if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
            return v
        if v.replace('.', '', 1).isdigit():
            return v
        return f"'{v}'"

class SXQLParser:
    def __init__(self):
        self.lark = Lark(SXQL_GRAMMAR, parser='lalr')
        self.transformer = SXQLTransformer()

    def translate_to_sql(self, query: str, tenant_id: str) -> dict:
        """Translates SXQL to ClickHouse SQL components."""
        if not query or query.strip() == "*":
            return {"where": f"tenant_id = '{tenant_id}'", "stats": None}
        
        try:
            tree = self.lark.parse(query)
            result = self.transformer.transform(tree)
            
            # If it's a simple expression without pipes, it might just be the where string
            if isinstance(result, str):
                return {"where": f"tenant_id = '{tenant_id}' AND ({result})", "stats": None}
            
            # Piped expression
            where = result["where"]
            stats = None
            for cmd in result["commands"]:
                if cmd["type"] == "stats":
                    stats = cmd
            
            return {
                "where": f"tenant_id = '{tenant_id}' AND ({where})",
                "stats": stats
            }
        except Exception as e:
            logger.error("Failed to parse SXQL", query=query, error=str(e))
            return {"where": f"tenant_id = '{tenant_id}'", "stats": None}

# Singleton
sxql_parser = SXQLParser()

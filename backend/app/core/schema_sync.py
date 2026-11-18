from __future__ import annotations

from typing import Iterable
from sqlalchemy import inspect, text
from sqlalchemy.schema import Column, Table, DefaultClause


def ensure_schema(engine, base, auto_add_missing_columns: bool = False) -> None:
    """
    Ensure database schema matches SQLAlchemy models.

    - Creates missing tables.
    - Optionally adds missing columns if safe.

    If missing non-nullable columns without defaults are found and
    auto_add_missing_columns is False, raises a RuntimeError with guidance.
    """
    inspector = inspect(engine)
    missing_columns: list[tuple[str, str]] = []

    for table in base.metadata.sorted_tables:
        if not inspector.has_table(table.name):
            base.metadata.create_all(bind=engine, tables=[table])
            continue

        existing_columns = {col["name"] for col in inspector.get_columns(table.name)}
        for column in table.columns:
            if column.name in existing_columns:
                continue

            if auto_add_missing_columns:
                prepared = _prepare_column_for_add(column)
                if prepared is None:
                    missing_columns.append((table.name, column.name))
                    continue
                with engine.begin() as conn:
                    # Use raw SQL to add column
                    col_type = prepared.type.compile(dialect=engine.dialect)
                    nullable = "NULL" if prepared.nullable else "NOT NULL"
                    default_clause = ""
                    
                    # Check for existing server_default or our custom _server_default_value
                    if prepared.server_default is not None:
                        # Extract the default value from server_default
                        if isinstance(prepared.server_default, DefaultClause):
                            default_value = str(prepared.server_default.arg)
                        else:
                            default_value = str(prepared.server_default)
                        default_clause = f" DEFAULT {default_value}"
                    elif hasattr(prepared, '_server_default_value'):
                        default_clause = f" DEFAULT {prepared._server_default_value}"
                    
                    add_col_sql = f'ALTER TABLE "{table.name}" ADD COLUMN "{prepared.name}" {col_type} {nullable}{default_clause}'
                    conn.execute(text(add_col_sql))
            else:
                missing_columns.append((table.name, column.name))

    if missing_columns:
        formatted = ", ".join([f"{t}.{c}" for t, c in missing_columns])
        raise RuntimeError(
            "Database schema is missing required columns: "
            f"{formatted}. Set AUTO_SCHEMA_UPDATE=true to auto-add safe columns, "
            "or run migrations to sync the schema."
        )


def _prepare_column_for_add(column):
    """
    Prepare a column for safe addition.
    - If non-nullable without server default, try to set server default.
    - If no safe default is available, relax nullability.
    """
    new_column = column.copy()

    if new_column.server_default is not None:
        return new_column

    if not new_column.nullable:
        if new_column.default is not None and getattr(new_column.default, "is_scalar", False):
            # Store the default value as a string, not a TextClause
            new_column._server_default_value = _to_server_default(new_column.default.arg)
        else:
            new_column.nullable = True

    return new_column


def _to_server_default(value):
    """Convert a Python value to a server default string (not wrapped in text())."""
    if isinstance(value, str):
        return f"'{value}'"
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)

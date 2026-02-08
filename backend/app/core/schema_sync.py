from __future__ import annotations

from typing import Iterable
from sqlalchemy import inspect, text
from sqlalchemy.schema import AddColumn


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
                    conn.execute(AddColumn(table, prepared))
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
            new_column.server_default = _to_server_default(new_column.default.arg)
        else:
            new_column.nullable = True

    return new_column


def _to_server_default(value):
    if isinstance(value, str):
        return text(f"'{value}'")
    if isinstance(value, bool):
        return text("true" if value else "false")
    return text(str(value))

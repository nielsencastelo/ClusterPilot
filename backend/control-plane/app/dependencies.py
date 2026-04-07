from typing import Annotated

from fastapi import Depends

from .store import InMemoryStore, store


def get_store() -> InMemoryStore:
    return store


StoreDep = Annotated[InMemoryStore, Depends(get_store)]

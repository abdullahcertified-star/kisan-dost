import threading

# Simple thread‑safe in‑memory store for farmer context.
# In production replace with Redis or a persistent DB.

_context_store = {}
_lock = threading.Lock()

def get_context(farmer_id: str) -> dict:
    """Return a shallow copy of the stored context for ``farmer_id``.
    If none exists, initialise an empty dict.
    """
    with _lock:
        return _context_store.get(farmer_id, {}).copy()

def update_context(farmer_id: str, new_context: dict) -> None:
    """Merge ``new_context`` into the stored context for ``farmer_id``.
    Existing keys are overwritten. Thread‑safe.
    """
    with _lock:
        ctx = _context_store.get(farmer_id, {})
        ctx.update(new_context)
        _context_store[farmer_id] = ctx

def clear_context(farmer_id: str) -> None:
    """Clear stored context for ``farmer_id``."""
    with _lock:
        if farmer_id in _context_store:
            del _context_store[farmer_id]

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * useAdminTable — shared hook for all admin data tables
 * Manages: items, loading, error, cursor-based pagination, sort, row selection
 *
 * @param {Function} fetchFn - async function(params) => { items, nextCursor }
 * @param {Object} initialParams - initial query params (search, role, status, etc.)
 */
export default function useAdminTable(fetchFn, initialParams = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cursorStack, setCursorStack] = useState([]); // stack of cursors for back navigation
  const [nextCursor, setNextCursor] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState({ column: null, direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [params, setParams] = useState(initialParams);

  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const fetchData = useCallback(async (cursor = undefined, currentParams = params) => {
    setLoading(true);
    setError(null);
    setSelectedIds(new Set());
    try {
      const result = await fetchFnRef.current({ ...currentParams, cursor, limit: 20 });
      const fetchedItems = result?.items ?? (Array.isArray(result) ? result : []);
      setItems(fetchedItems);
      setNextCursor(result?.nextCursor ?? null);
    } catch (err) {
      setError(err?.message || 'Lỗi tải dữ liệu');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [params]);

  // Initial load + reload when params change
  useEffect(() => {
    setCursorStack([]);
    setCurrentPage(1);
    fetchData(undefined, params);
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const reload = useCallback(() => {
    const cursor = cursorStack[cursorStack.length - 1];
    fetchData(cursor, params);
  }, [cursorStack, params, fetchData]);

  // Pagination
  const goNext = useCallback(() => {
    if (!nextCursor) return;
    setCursorStack((prev) => [...prev, nextCursor]);
    setCurrentPage((p) => p + 1);
    fetchData(nextCursor, params);
  }, [nextCursor, params, fetchData]);

  const goPrev = useCallback(() => {
    if (cursorStack.length === 0) return;
    const newStack = cursorStack.slice(0, -1);
    const prevCursor = newStack[newStack.length - 1]; // undefined = page 1
    setCursorStack(newStack);
    setCurrentPage((p) => p - 1);
    fetchData(prevCursor, params);
  }, [cursorStack, params, fetchData]);

  // Sort (client-side on current page)
  const toggleSort = useCallback((column) => {
    setSort((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const sortedItems = [...items].sort((a, b) => {
    if (!sort.column) return 0;
    const aVal = a[sort.column] ?? '';
    const bVal = b[sort.column] ?? '';
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sort.direction === 'asc' ? cmp : -cmp;
  });

  // Selection
  const toggleRow = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === items.length) return new Set();
      return new Set(items.map((item) => item.id));
    });
  }, [items]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // Update a single item in local state (optimistic update)
  const updateItem = useCallback((id, changes) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, ...changes } : item));
  }, []);

  // Remove a single item from local state
  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }, []);

  return {
    items: sortedItems,
    loading,
    error,
    currentPage,
    pagination: {
      goNext,
      goPrev,
      hasNext: !!nextCursor,
      hasPrev: currentPage > 1,
    },
    sort: {
      column: sort.column,
      direction: sort.direction,
      toggle: toggleSort,
    },
    selection: {
      selectedIds,
      toggleRow,
      toggleAll,
      clearSelection,
      allSelected: items.length > 0 && selectedIds.size === items.length,
    },
    params,
    setParams,
    reload,
    updateItem,
    removeItem,
  };
}

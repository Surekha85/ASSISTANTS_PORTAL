import { useState } from "react";

export const useSortableData = (items = []) => {
  const [sortConfig, setSortConfig] = useState(null);

  const sortedItems = [...items].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction, type } = sortConfig;

    let valA = a[key];
    let valB = b[key];

    // 🔥 Handle DATE
    if (type === "date") {
      valA = new Date(valA);
      valB = new Date(valB);
    }

    // 🔥 Handle NUMBER
    if (type === "number") {
      valA = Number(valA);
      valB = Number(valB);
    }

    // 🔥 Default STRING
    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const requestSort = (key, type = "string") => {
    let direction = "asc";

    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }

    setSortConfig({ key, direction, type });
  };

  return { sortedItems, requestSort, sortConfig };
};
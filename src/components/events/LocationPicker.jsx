import React, { useState, useRef, useEffect } from "react";

export default function LocationPicker({
  value,
  onChange,
  placeholder = "Search city or address in Poland…",
}) {
  const [query, setQuery] = useState(value?.display_name ?? "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value?.display_name && value.display_name !== query) {
      setQuery(value.display_name);
    }
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = (q) => {
    setQuery(q);
    if (!q.trim()) {
      setSuggestions([]);
      onChange(null);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=pl&format=json&limit=6&addressdetails=1`;
        const res = await fetch(url, {
          headers: { "Accept-Language": "pl,en" },
        });
        const data = await res.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const select = (item) => {
    setQuery(item.display_name);
    setSuggestions([]);
    onChange({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    });
  };

  return (
    <div className="location-picker" ref={wrapperRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {(loading || suggestions.length > 0) && (
        <div className="location-suggestions">
          {loading && <div className="location-loading">Searching…</div>}
          {suggestions.map((item) => (
            <div
              key={item.place_id}
              className="location-suggestion-item"
              onMouseDown={() => select(item)}
            >
              {item.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

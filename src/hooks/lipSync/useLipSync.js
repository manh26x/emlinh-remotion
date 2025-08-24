import { useEffect, useState } from 'react';

const cache = new Map();

export const useLipSync = (url) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!url) {
      return;
    }

    if (cache.has(url)) {
      setData(cache.get(url));
      return;
    }

    let isMounted = true;
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        if (isMounted) {
          cache.set(url, json.mouthCues);
          setData(json.mouthCues);
        }
      } catch (error) {
        console.error("Could not fetch or parse lip-sync data:", error);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [url]);

  return data;
};

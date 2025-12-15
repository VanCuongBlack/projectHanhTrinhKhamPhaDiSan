import { createContext, forwardRef, useContext, useEffect, useRef, useState, useCallback } from 'react';

const TabsContext = createContext(null);

const Tabs = ({ value, onValueChange, children }) => {
  const tabRefs = useRef({});
  const listRef = useRef(null);
  const [indicator, setIndicator] = useState({ width: 0, left: 0 });

  const updateIndicator = useCallback(() => {
    const el = tabRefs.current[value];
    const container = listRef.current;
    if (el && container) {
      const rect = el.getBoundingClientRect();
      const crect = container.getBoundingClientRect();
      setIndicator({ width: rect.width, left: rect.left - crect.left });
    }
  }, [value]);

  useEffect(() => {
    const raf = requestAnimationFrame(updateIndicator);
    window.addEventListener('resize', updateIndicator);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [updateIndicator]);

  const registerTrigger = (key, el) => {
    if (el) tabRefs.current[key] = el;
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange, registerTrigger, indicator, listRef }}>
      {children}
    </TabsContext.Provider>
  );
};

const TabsList = forwardRef(function TabsList(props, ref) {
  const { indicator, listRef } = useContext(TabsContext);
  return (
    <div
      ref={(el) => {
        listRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      role="tablist"
      {...props}
    >
      {props.children}
      <span
        className="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300"
        style={{
          width: `${indicator.width || 0}px`,
          transform: `translateX(${indicator.left || 0}px)`,
        }}
      />
    </div>
  );
});

const TabsTrigger = forwardRef(function TabsTrigger({ tabKey, children, className = '', ...rest }, ref) {
  const { value, onValueChange, registerTrigger } = useContext(TabsContext);
  const active = value === tabKey;
  return (
    <button
      ref={(el) => {
        registerTrigger(tabKey, el);
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      role="tab"
      aria-selected={active}
      onClick={() => onValueChange?.(tabKey)}
      className={`py-3 text-sm font-bold transition-colors bg-transparent border-none outline-none shadow-none px-0 hover:bg-transparent focus:bg-transparent active:bg-transparent ${
        active ? 'text-[#111813]' : 'text-[#111813]/70'
      } ${className}`}
      style={{ boxShadow: 'none', background: 'transparent', border: 'none' }}
      {...rest}
    >
      {children}
    </button>
  );
});

export { Tabs, TabsList, TabsTrigger };

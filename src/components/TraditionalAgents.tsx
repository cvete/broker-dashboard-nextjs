/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useEffect, useRef, useState } from \"react\";
import Tooltip from \"./Tooltip\";

interface BrokerData {
  broker: string;
  rent: number;
  sale: number;
}

export interface TraditionalAgentsProps {
  data: BrokerData[];
  title: string;
  maxTotal: number;
  rentLabel: string;
  saleLabel: string;
  propertiBroker?: BrokerData;
}

const LABEL_WIDTH = 140; // px, for 15 chars
const BAR_CONTAINER_WIDTH = 335; // px, bar container width
const MAX_BAR_WIDTH = 290; // px, max width for the bar itself
const GAP = 8; // px, gap between label and bar
const NUMBER_MARGIN = 8; // px, margin between bar end and number
const NUMBER_WIDTH = 40; // px, fixed width for number box
const BAR_WIDTH = MAX_BAR_WIDTH - NUMBER_WIDTH; // px, bar container width
const PADDING = 16; // px, estimated total horizontal paddings/gaps
const DIGIT_WIDTH = 9; // px, estimated width per digit
const NUMBER_EXTRA = 2; // px, reduce extra padding for number
const MIN_BAR_PX = 4; // px, minimum bar width for nonzero values

export function TraditionalAgents({ data, title, maxTotal, rentLabel, saleLabel, propertiBroker }: TraditionalAgentsProps) {
  // Animation state
  const [showBars, setShowBars] = useState(false);
  const [showTotals, setShowTotals] = useState(false);
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    broker?: BrokerData;
  }>({ show: false, x: 0, y: 0 });
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Reset animation states when data changes
    setShowBars(false);
    setShowTotals(false);
    
    // Start animations with a slight delay
    const barTimeout = setTimeout(() => setShowBars(true), 100);
    const totalTimeout = setTimeout(() => setShowTotals(true), 800);
    
    return () => {
      clearTimeout(barTimeout);
      clearTimeout(totalTimeout);
    };
  }, [data, maxTotal]);

  const handleMouseEnter = (idx: number, broker: BrokerData) => () => {
    const rect = barRefs.current[idx]?.getBoundingClientRect();
    if (rect) {
      setTooltip({
        show: true,
        x: rect.left + rect.width / 2,
        y: rect.top - 12,
        broker,
      });
    }
  };
  const handleMouseLeave = () => setTooltip({ show: false, x: 0, y: 0 });

  if (!Array.isArray(data)) {
    return (
      <div className=\"w-full flex items-center justify-center py-12 text-red-600 font-semibold text-center\">
        Server Error. Please get in touch with your administrator.
      </div>
    );
  }

  // Prepare sorted data: filter out total=0
  let filtered = [...data].filter((item) => (item.rent + item.sale) > 0);

  // Always add 'properti' (all lowercase) to the list using its real data from proptech if present
  if (propertiBroker && (propertiBroker.rent + propertiBroker.sale) > 0) {
    const exists = filtered.some(b => b.broker.trim().toLowerCase() === \"properti\");
    if (!exists) {
      filtered.push(propertiBroker);
    }
  }
  // Remove duplicates (if any)
  filtered = filtered.filter((b, i, arr) => arr.findIndex(x => x.broker.trim().toLowerCase() === b.broker.trim().toLowerCase()) === i);

  // Sort by total listings descending
  const sorted = filtered.sort((a, b) => (b.rent + b.sale) - (a.rent + a.sale));

  return (
    <div className=\"bg-[#fcfcfc] rounded-[7.7px] w-full border\">
      <Tooltip show={tooltip.show} x={tooltip.x} y={tooltip.y}>
        {tooltip.broker && (
          <div className=\"flex flex-col items-start\">
            <div className=\"font-bold text-black mb-1\">{tooltip.broker.broker}</div>
            <div className=\"flex items-center gap-2 mb-0.5\">
              <span className=\"w-3 h-3 rounded bg-[#0c56bc] inline-block\" />
              <span className=\"text-gray-900\">{rentLabel}: {tooltip.broker.rent}</span>
            </div>
            <div className=\"flex items-center gap-2\">
              <span className=\"w-3 h-3 rounded bg-[#69c29d] inline-block\" />
              <span className=\"text-gray-900\">{saleLabel}: {tooltip.broker.sale}</span>
            </div>
          </div>
        )}
      </Tooltip>
      <div className=\"relative size-full\">
        <div className=\"flex flex-col gap-[6.4px] items-start justify-start p-[15.4px]\">
          <div className=\"w-full\">
            <div className=\"flex flex-col gap-[30.8px] items-start justify-center w-full\">
              <div className=\"font-semibold text-[#212123] text-[18px] text-left\">
                <p className=\"leading-normal whitespace-pre\">{title}</p>
              </div>
              <div>
                <div className=\"flex flex-col gap-[10.3px] items-start justify-start\">
                  {sorted.map((item, idx) => {
                    const total = item.rent + item.sale;
                    const isProperti = item.broker.trim().toLowerCase() === \"properti\";
                    const displayName = item.broker.length > 15 ? item.broker.slice(0, 15) + '…' : item.broker;
                    // Bar width in px, capped at MAX_BAR_WIDTH
                    const barWidth = total > 0 ? (total / maxTotal) * MAX_BAR_WIDTH : 0;
                    const rentWidth = total > 0 ? (item.rent / total) * barWidth : 0;
                    const saleWidth = total > 0 ? (item.sale / total) * barWidth : 0;
                    return (
                      <div key={idx} className=\"flex flex-row items-center\" style={{ width: LABEL_WIDTH + BAR_CONTAINER_WIDTH + 100 }}>
                        <div className=\"font-normal text-[#000] text-[15.4px] text-left whitespace-nowrap\" style={{ minWidth: LABEL_WIDTH, maxWidth: LABEL_WIDTH, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <p className={`leading-normal whitespace-pre ${isProperti ? 'font-bold italic' : ''}`}>{displayName}</p>
                        </div>
                        <div style={{ width: BAR_CONTAINER_WIDTH, marginLeft: GAP }} className=\"relative flex flex-row items-center cursor-pointer bg-transparent h-[26.3px]\">
                          <div
                            ref={el => {
                              barRefs.current[idx] = el;
                            }}
                            className=\"flex flex-row items-center h-full\"
                            style={{ 
                              width: showBars ? barWidth : 0,
                              transition: 'width 0.7s cubic-bezier(.4,1.7,.6,.97)'
                            }}
                            onMouseEnter={handleMouseEnter(idx, item)}
                            onMouseLeave={handleMouseLeave}
                          >
                            <div
                              className=\"bg-[#0c56bc] h-full\"
                              style={{ 
                                width: showBars ? rentWidth : 0,
                                transition: 'width 0.7s cubic-bezier(.4,1.7,.6,.97)'
                              }}
                            />
                            <div
                              className=\"bg-[#69c29d] h-full\"
                              style={{ 
                                width: showBars ? saleWidth : 0,
                                transition: 'width 0.7s cubic-bezier(.4,1.7,.6,.97)'
                              }}
                            />
                          </div>
                          {/* Number appears immediately after the bar, with a small left margin */}
                          {total > 0 && (
                            <span
                              className={`text-xs text-gray-700 font-medium transition-opacity duration-500 flex items-center justify-end ${showTotals ? 'opacity-100' : 'opacity-0'}`}
                              style={{ marginLeft: NUMBER_MARGIN }}
                            >
                              {total}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
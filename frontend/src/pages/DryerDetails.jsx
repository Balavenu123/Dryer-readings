import React from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function DryerDetails() {
  const { id } = useParams();
  const { telemetry, toggleDryer } = useSocket();
  
  const dryerId = parseInt(id);
  const dryer = telemetry.find(d => d.dryerId === dryerId);

  if (!dryer) {
    return (
      <div className="p-6 text-center">
        <h3 className="font-headline-md text-error">Dryer not found</h3>
      </div>
    );
  }

  const isRunning = dryer.status === 'Running';
  const bin = dryer.binStatus || { completedBins: 0, downAirUnderProcess: 0, emptyBins: 16, intakeUnderProcess: 0, totalBins: 16, upAirUnderProcess: 0 };
  const tempRh = dryer.tempRh || {};

  // Formatter to show "####" when no data is present, matching the image.
  const formatVal = (val) => val != null ? val : '####';

  // HMI Styles
  const hmiContainerStyle = "min-h-full bg-[#BDBDBD] p-8 text-black font-sans font-bold flex flex-col items-center gap-6 overflow-y-auto";
  const boxStyle = "bg-[#808080] border-2 border-black flex flex-col p-4 shadow-sm";
  const titleStyle = "text-[#0000B3] text-center text-[1.4rem] font-black mb-6 uppercase";
  const rowStyle = "flex justify-between items-center mb-4 text-[13px]";
  const labelContainerStyle = "flex flex-col";
  const labelStyle = "text-black uppercase";
  const addressStyle = "hidden";
  const valueContainerStyle = "flex gap-2 items-center";
  const valueStyle = "text-[#00FF00] tracking-wider text-lg drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]";
  const unitStyle = "text-white text-sm drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]";

  return (
    <div className={hmiContainerStyle}>
      <div className="w-full flex justify-end mb-[-1rem]">
        <button 
          onClick={() => toggleDryer(dryer.dryerId)}
          className={`px-4 py-2 font-bold uppercase border-2 border-black ${isRunning ? 'bg-[#00FF00] text-black' : 'bg-[#FF0000] text-white'}`}
        >
          {dryer.status}
        </button>
      </div>


      {/* MIDDLE THREE COLUMNS */}
      <div className="flex flex-row w-full max-w-[1300px] justify-between gap-4 mt-2">
        
        {/* TOP TUNNEL DATA */}
        <div className={`${boxStyle} flex-1`}>
          <h2 className={titleStyle}>TOP TUNNEL DATA</h2>
          
          <div className={rowStyle}>
            <div className={labelContainerStyle}>
              <span className={labelStyle}>PRESSURE :-</span>
              <span className={addressStyle}>Address: K0013</span>
            </div>
            <div className={valueContainerStyle}>
              <span className={valueStyle}>{formatVal(tempRh.topTunnelPressure)}</span>
              <span className={unitStyle}>mmWC</span>
            </div>
          </div>
          <div className={rowStyle}>
            <div className={labelContainerStyle}>
              <span className={labelStyle}>TUNNEL START TEMPERATURE:-</span>
              <span className={addressStyle}>Address: K0015</span>
            </div>
            <div className={valueContainerStyle}>
              <span className={valueStyle}>{formatVal(tempRh.topTunnelStartTemp)}</span>
              <span className={unitStyle}>°C</span>
            </div>
          </div>
          <div className={rowStyle}>
            <div className={labelContainerStyle}>
              <span className={labelStyle}>TUNNEL START HUMIDITY :-</span>
              <span className={addressStyle}>Address: K0014</span>
            </div>
            <div className={valueContainerStyle}>
              <span className={valueStyle}>{formatVal(tempRh.topTunnelStartHumidity)}</span>
              <span className={unitStyle}>%</span>
            </div>
          </div>
          
          <div className="my-2 border-t border-black/20"></div>
          
          <div className={rowStyle}>
            <div className={labelContainerStyle}>
              <span className={labelStyle}>TUNNEL MID TEMPERATURE :-</span>
              <span className={addressStyle}>Address: K0012</span>
            </div>
            <div className={valueContainerStyle}>
              <span className={valueStyle}>{formatVal(tempRh.topTunnelMidTemp)}</span>
              <span className={unitStyle}>°C</span>
            </div>
          </div>
          <div className={rowStyle}>
            <div className={labelContainerStyle}>
              <span className={labelStyle}>TUNNEL MID HUMIDITY :-</span>
              <span className={addressStyle}>Address: K0011</span>
            </div>
            <div className={valueContainerStyle}>
              <span className={valueStyle}>{formatVal(tempRh.topTunnelMidHumidity)}</span>
              <span className={unitStyle}>%</span>
            </div>
          </div>
          
          <div className="my-2 border-t border-black/20"></div>
          
          <div className={rowStyle}>
            <div className={labelContainerStyle}>
              <span className={labelStyle}>TUNNEL END TEMPERATURE :-</span>
              <span className={addressStyle}>Address: K0010</span>
            </div>
            <div className={valueContainerStyle}>
              <span className={valueStyle}>{formatVal(tempRh.topTunnelEndTemp)}</span>
              <span className={unitStyle}>°C</span>
            </div>
          </div>
          <div className={rowStyle}>
            <div className={labelContainerStyle}>
              <span className={labelStyle}>TUNNEL END HUMIDITY :-</span>
              <span className={addressStyle}>Address: K0009</span>
            </div>
            <div className={valueContainerStyle}>
              <span className={valueStyle}>{formatVal(tempRh.topTunnelEndHumidity)}</span>
              <span className={unitStyle}>%</span>
            </div>
          </div>
        </div>

        {/* BOTTOM TUNNEL DATA */}
        <div className={`${boxStyle} flex-1`}>
          <h2 className={titleStyle}>BOTTOM TUNNEL DATA</h2>
          
          <div className={rowStyle}>
            <div className={labelContainerStyle}>
              <span className={labelStyle}>PRESSURE :-</span>
              <span className={addressStyle}>Address: K0002</span>
            </div>
            <div className={valueContainerStyle}>
              <span className={valueStyle}>{formatVal(tempRh.bottomTunnelPressure)}</span>
              <span className={unitStyle}>mmWC</span>
            </div>
          </div>
          <div className={rowStyle}>
            <div className={labelContainerStyle}>
              <span className={labelStyle}>TUNNEL START TEMPERATURE:-</span>
              <span className={addressStyle}>Address: K0008</span>
            </div>
            <div className={valueContainerStyle}>
              <span className={valueStyle}>{formatVal(tempRh.bottomTunnelStartTemp)}</span>
              <span className={unitStyle}>°C</span>
            </div>
          </div>
          <div className={rowStyle}>
            <div className={labelContainerStyle}>
              <span className={labelStyle}>TUNNEL START HUMIDITY :-</span>
              <span className={addressStyle}>Address: K0007</span>
            </div>
            <div className={valueContainerStyle}>
              <span className={valueStyle}>{formatVal(tempRh.bottomTunnelStartHumidity)}</span>
              <span className={unitStyle}>%</span>
            </div>
          </div>
          
          <div className="my-2 border-t border-black/20"></div>
          
          <div className={rowStyle}>
            <div className={labelContainerStyle}>
              <span className={labelStyle}>TUNNEL MID TEMPERATURE :-</span>
              <span className={addressStyle}>Address: K0006</span>
            </div>
            <div className={valueContainerStyle}>
              <span className={valueStyle}>{formatVal(tempRh.bottomTunnelMidTemp)}</span>
              <span className={unitStyle}>°C</span>
            </div>
          </div>
          <div className={rowStyle}>
            <div className={labelContainerStyle}>
              <span className={labelStyle}>TUNNEL MID HUMIDITY :-</span>
              <span className={addressStyle}>Address: K0005</span>
            </div>
            <div className={valueContainerStyle}>
              <span className={valueStyle}>{formatVal(tempRh.bottomTunnelMidHumidity)}</span>
              <span className={unitStyle}>%</span>
            </div>
          </div>
          
          <div className="my-2 border-t border-black/20"></div>
          
          <div className={rowStyle}>
            <div className={labelContainerStyle}>
              <span className={labelStyle}>TUNNEL END TEMPERATURE :-</span>
              <span className={addressStyle}>Address: K0004</span>
            </div>
            <div className={valueContainerStyle}>
              <span className={valueStyle}>{formatVal(tempRh.bottomTunnelEndTemp)}</span>
              <span className={unitStyle}>°C</span>
            </div>
          </div>
          <div className={rowStyle}>
            <div className={labelContainerStyle}>
              <span className={labelStyle}>TUNNEL END HUMIDITY :-</span>
              <span className={addressStyle}>Address: K0003</span>
            </div>
            <div className={valueContainerStyle}>
              <span className={valueStyle}>{formatVal(tempRh.bottomTunnelEndHumidity)}</span>
              <span className={unitStyle}>%</span>
            </div>
          </div>
        </div>

        {/* BIN STATUS */}
        <div className={`${boxStyle} flex-1`}>
          <h2 className={titleStyle}>BIN STATUS</h2>
          
          <div className={rowStyle}>
            <div className={labelContainerStyle}>
              <span className={labelStyle}>UP AIR PROCESS:-</span>
              <span className={addressStyle}>Address: K0005</span>
            </div>
            <div className={valueContainerStyle}>
              <span className={valueStyle}>{formatVal(bin.upAirUnderProcess)}</span>
            </div>
          </div>
          <div className={rowStyle}>
            <div className={labelContainerStyle}>
              <span className={labelStyle}>DOWN AIR PROCESS:-</span>
              <span className={addressStyle}>Address: K0001</span>
            </div>
            <div className={valueContainerStyle}>
              <span className={valueStyle}>{formatVal(bin.downAirUnderProcess)}</span>
            </div>
          </div>
          <div className={rowStyle}>
            <div className={labelContainerStyle}>
              <span className={labelStyle}>INTAKE PROCESS :-</span>
              <span className={addressStyle}>Address: K0003</span>
            </div>
            <div className={valueContainerStyle}>
              <span className={valueStyle}>{formatVal(bin.intakeUnderProcess)}</span>
            </div>
          </div>
          
          <div className="my-2 border-t border-black/20"></div>
          
          <div className={rowStyle}>
            <div className={labelContainerStyle}>
              <span className={labelStyle}>TOTAL BINS :-</span>
              <span className={addressStyle}>Address: K0004</span>
            </div>
            <div className={valueContainerStyle}>
              <span className={valueStyle}>{formatVal(bin.totalBins)}</span>
            </div>
          </div>
          <div className={rowStyle}>
            <div className={labelContainerStyle}>
              <span className={labelStyle}>COMPLETED BINS :-</span>
              <span className={addressStyle}>Address: K0000</span>
            </div>
            <div className={valueContainerStyle}>
              <span className={valueStyle}>{formatVal(bin.completedBins)}</span>
            </div>
          </div>
          <div className={rowStyle}>
            <div className={labelContainerStyle}>
              <span className={labelStyle}>EMPTY BINS :-</span>
              <span className={addressStyle}>Address: K0002</span>
            </div>
            <div className={valueContainerStyle}>
              <span className={valueStyle}>{formatVal(bin.emptyBins)}</span>
            </div>
          </div>
        </div>
        
      </div>

      {/* BOTTOM BOX */}
      <div className={`${boxStyle} w-full max-w-[800px] flex flex-col gap-6 py-8 mt-2`}>
        <div className="flex justify-between items-center px-12">
          <div className="flex flex-col">
            <span className="text-[#0000B3] uppercase text-lg font-black">BOILER HEADER TEMPERATURE:-</span>
            <span className={addressStyle}>Address: K0000 (Float)</span>
          </div>
          <div className="flex gap-2 items-center text-lg font-black bg-black/80 px-3 py-1 rounded border border-black">
            <span className="text-[#00FF00] tracking-wider text-xl font-mono">{formatVal(tempRh.boilerHeaderTemp)}</span>
            <span className="text-white">°C</span>
          </div>
        </div>

        <div className="flex justify-between items-center px-12">
          <div className="flex flex-col">
            <span className="text-[#0000B3] uppercase text-lg font-black">HEADER TEMPETURE - TOP TUNNEL TEMPERATURE:-</span>
            <span className={addressStyle}>Address: K0001 (Float)</span>
          </div>
          <div className="flex gap-2 items-center text-lg font-black bg-black/80 px-3 py-1 rounded border border-black">
            <span className="text-[#00FF00] tracking-wider text-xl font-mono">{formatVal(tempRh.boilerHeaderTopStartTemp)}</span>
            <span className="text-white">°C</span>
          </div>
        </div>
      </div>
    </div>
  );
}

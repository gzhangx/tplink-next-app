'use client'
import { util } from '@gzhangx/googleapi'
import { useEffect, useRef,  useState } from "react";
import {
  LineController, Chart, CategoryScale, LinearScale, PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend, 
  LegendItem} from 'chart.js'

import { orderBy, uniq } from 'lodash'

const MAX_LEGENDS = 5;

export default function Home() {

  const canvasRef = useRef<HTMLCanvasElement>(null);

  type ShortDataSetType = {
    label: string;
    borderColor: string;
    data: number[];
  };
  const [curData, setCurData] = useState<{
    labels: string[];
    datasets: ShortDataSetType[];
    reloadCount: number;
  }>({
    labels: [],
    datasets: [],
    reloadCount: 1,
  });

  const colors = Object.freeze([
    'rgb(235, 55, 20)',
    'rgb(81, 78, 223)',
    'rgb(78, 223, 143)',
    'rgb(223, 78, 223)',
    'rgb(223, 189, 78)',
    'rgb(199, 78, 223)',
    'rgb(194, 78, 223)',
    'rgb(78, 136, 223)',
    'rgb(78, 223, 119)',
    'rgb(77, 93, 30)',
    'rgb(14, 28, 72)',
    'rgb(23, 24, 26)',
  ]);
  function doReq(table: 'trafficLog' | 'deviceTrafficLog') {
    util.doHttpRequest({
      method: 'POST',
      url: 'http://192.168.0.40:8001/sql',
      data: {
        //"table": "trafficLog",
        table,
        "groupAt": "day",
        "where": [
          //["day", "28", "29"]
        ]
      }
    }).then(res => {
      console.log(res.data)
      type RawData = {
        year: number; month: number; day: number; down: number; up: number; deviceName: string;
      };
      const data = orderBy(res.data as RawData[], ['year', 'month', 'day', 'hour', 'min', 'name']);
      const newData = { ...curData };
      function rawDataToDate(d: RawData) {
        try {
          return `${d.year}-${d.month.toString().padStart(2, '0')}-${d.day.toString().padStart(2, '0')}`;
        } catch (err) {
          console.log('bad data', d);
          throw err;
        }
      }
      newData.labels = uniq(data.map(rawDataToDate));
      newData.datasets = [];
      let colorInd = 0;
      if (table === 'trafficLog') {
        for (const label of ['down', 'up']) {
          const ds: ShortDataSetType = {
            label,
            borderColor: colors[colorInd++],
            data: [],
          };
          data.forEach(d => {
            ds.data.push(d[label as 'up']);
          })
          newData.datasets.push(ds);
        }
      } else {
        type DeviceTotal = {
          name: string;
          total: number;
        }
        const deviceNamesWithTotalUnsorted: DeviceTotal[] = data.reduce((acc, d) => {
          if (!acc.dict[d.deviceName]) {
            const dt: DeviceTotal = {
              name: d.deviceName,
              total: d.down + d.up,
            }
            acc.dict[d.deviceName] = dt;
            acc.rows.push(dt);
          } else {
            acc.dict[d.deviceName].total += d.down + d.up;
          }
          return acc;
        }, {
          dict: {},
          rows: [],
        } as {
          dict: { [name: string]: DeviceTotal; };
          rows: DeviceTotal[];
        }).rows;

        const deviceTotalSorted = orderBy(deviceNamesWithTotalUnsorted, d => d.total, 'desc');

        for (const dev of deviceTotalSorted) {
          const label = `${dev.name}:${(dev.total/1000).toFixed(2)}GB`;
          const ds: ShortDataSetType = {
            label,
            borderColor: colors[colorInd++],
            data: [],
          };
          
          for (const day of newData.labels) {
            const found = data.find(d => d.deviceName === dev.name && rawDataToDate(d) === day);
            if (!found) {
              ds.data.push(0);
            } else {
              ds.data.push(found.down + found.up);
            }
          }
          newData.datasets.push(ds);
        }
      }
      newData.reloadCount = curData.reloadCount + 1;
      setCurData(newData);
    }).catch(err => {
      console.log(err);
    })  
  }

  console.log('canvasRef.current', canvasRef.current)
  useEffect(() => {
    if (document.getElementById('canv1') && canvasRef.current) {
      console.log('creating chart', canvasRef.current, typeof canvasRef.current)
      Chart.register(CategoryScale);
      Chart.register(LineController);
      Chart.register(LinearScale);
      Chart.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        ArcElement,
        Title,
        Tooltip,
        Legend
      );

      console.log(curData.labels, curData.datasets)

      const curChartObj = new Chart('canv1', {
        type: 'line',
        data: {
          labels: curData.labels, //["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          datasets: curData.datasets.map(d => {
            return {
              backgroundColor: d.borderColor,
              //borderColor: "rgb(39, 24, 4)",
              pointRadius: 3,
              pointBackgroundColor: d.borderColor,
              pointBorderColor: "rgba(78, 115, 223, 1)",
              pointHoverRadius: 3,
              pointHoverBackgroundColor: "rgba(78, 115, 223, 1)",
              pointHoverBorderColor: "rgba(78, 115, 223, 1)",
              pointHitRadius: 10,
              pointBorderWidth: 2,
              ...d
            };
          }),
        },
        options: {
          layout: {
            padding: {
              left: 10,
              right: 25,
              top: 25,
              bottom: 0
            }
          },
          onHover: (event, elements,) => {
            if (!event) 
              console.log(event, elements);
          },
          plugins: {
            legend: {
              labels: {
                generateLabels: function () {
                  //const original = Chart.overrides.line.plugins.legend.labels.generateLabels;
                  //const labels = original.call(this, chart);
                  //return labels.slice(0, 5);
                  return curData.datasets.map(d => {
                    const item: LegendItem =  {
                      text: d.label,                    
                      fillStyle: d.borderColor,
                    }
                    return item;
                  }).slice(0, MAX_LEGENDS)
                }
              }
            }
          }
        }
        //plugins
      });

      return () => {
        curChartObj.destroy();
      }
    }
  }, [ canvasRef.current, curData.reloadCount, curData.datasets, curData.labels])
  //Chart.register(LineController);
  

  useEffect(() => {
    //addLibrary('https://cdn.jsdelivr.net/npm/chart.js')
    doReq('trafficLog');
  }, ['once'])
  return (
    <div className="grid items-center justify-items-center min-h-screen   sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start" style={{ width: '100%', height: '100%' }}>
        <div className="flex gap-4 items-center flex-col sm:flex-row" style={{ height:'60px'}}>          
          <button className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            onClick={() => doReq('trafficLog')}>Router Log</button>          
          
          <button className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            onClick={() => doReq('deviceTrafficLog')}>Device Log</button>
        </div>
        
        <div style={{ width: '80%', height: '80%'}}>
          <canvas id={'canv1'} ref={canvasRef} width={'150px'} height={'150px'} ></canvas>
        </div>
        
        

      </main>
    </div>
  );
}

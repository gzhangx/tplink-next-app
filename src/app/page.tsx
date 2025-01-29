'use client'
import Image from "next/image";
import { util } from '@gzhangx/googleapi'
import { useEffect, useRef, forwardRef, createElement, HTMLElementType, useState } from "react";
import {
  LineController, Chart, ChartComponentLike, CategoryScale, LinearScale, PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend } from 'chart.js'

import { orderBy } from 'lodash'


export default function Home() {

  const canvasRef = useRef<HTMLCanvasElement>(null);

  type ShortDataSetType = {
    label: string;
    color: string;
    data: number[];
  };
  const [curData, setCurData] = useState<{
    labels: string[];
    datasets: ShortDataSetType[];
  }>({
    labels: [],
    datasets: [],
  });
  function doReq() {
    util.doHttpRequest({
      method: 'POST',
      url: 'http://192.168.0.40:8001/sql',
      data: {
        "table": "trafficLog",
        "groupAt": "day",
        "where": [
          //["day", "28", "29"]
        ]
      }
    }).then(res => {
      console.log(res.data)
      const data = orderBy(res.data as {
        year: number; month: number; day: number; down: number; up: number;
      }[], ['year', 'month', 'day', 'hour', 'min', 'name']);
      const newData = { ...curData };
      newData.labels = data.map(d => `${d.year}-${d.month.toString().padStart(2, '0')}-${d.day.toString().padStart(2, '0')}`);
      newData.datasets = [];
      for (const label of ['down', 'up']) {
        const ds: ShortDataSetType = {
          label,
          color: "rgba(78, 115, 223, 1)",
          data: [],
        };
        data.forEach(d => {          
          ds.data.push(d[label as 'up']);
        })
        newData.datasets.push(ds);
      }
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
              backgroundColor: "rgba(78, 115, 223, 0.05)",
              borderColor: "rgba(78, 115, 223, 1)",
              pointRadius: 3,
              pointBackgroundColor: "rgba(78, 115, 223, 1)",
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
          onHover: (event, elements, chart) => {
            console.log(event, elements);
          }
        }
        //plugins
      });

      return () => {
        curChartObj.destroy();
      }
    }
  }, ['once', canvasRef.current])
  //Chart.register(LineController);
  

  useEffect(() => {
    //addLibrary('https://cdn.jsdelivr.net/npm/chart.js')
    doReq();
  }, ['once'])
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <button onClick={() => doReq()}>Test</button>
        <canvas id={'canv1'} ref={canvasRef} width={'250px'} height={'250px'} style={{'background':'grey'}}></canvas>
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              src/app/page.tsx
            </code>
            .
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}

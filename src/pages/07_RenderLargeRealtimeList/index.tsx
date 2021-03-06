import { CSSProperties, useCallback, useEffect, useRef, useState } from 'react'
import { FixedSizeList } from 'react-window'
import { socket } from '../../index'

function useSocketIo(eventName: string, callback: (data: any) => void, isPause: boolean): null {
  useEffect(() => {
    socket.connect()

    return () => {
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    if (isPause) {
      socket.off(eventName, callback)
    } else {
      socket.on(eventName, callback)
    }
    return () => {
      socket.off(eventName, callback)
    }
  }, [eventName, callback, isPause])

  return null
}

const ITEM_SIZE = 50

export default function RenderLargeRealtimeList() {
  const [data, setData] = useState<Array<any>>([])
  const [range, setRange] = useState<{ begin: number; end: number }>({ begin: 0, end: 10 })
  const [isPause, setPause] = useState(false)

  useEffect(() => {
    console.log('range', range)
    socket.emit('serverGetNewRange', range)
  }, [range])

  const dataFirstTimeCallback = useCallback((newData) => {
    setData(newData)
  }, [])

  const dataIntervalCallback = useCallback(
    (newData) => {
      setData((prevData) => {
        const prevDataCopied = [...prevData]
        for (let i = range.begin; i < range.end; i++) {
          prevDataCopied[i] = newData[i - range.begin]
        }
        return prevDataCopied
      })
    },
    [range]
  )

  useSocketIo('dataFirstTime', dataFirstTimeCallback, false)
  useSocketIo('dataInterval', dataIntervalCallback, isPause)

  const myRef = useRef<HTMLDivElement>(null)

  const Row = ({ index, style }: { index: number; style: CSSProperties }) => {
    if (data[index] === undefined || data[index] === null) {
      return null
    }

    return (
      <div
        style={{
          height: '50px',
          backgroundColor: index % 2 === 0 ? 'orange' : 'cyan',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          ...style,
        }}
      >
        <div style={{ width: '150px' }}>Row {index}</div>
        <div style={{ width: '250px' }}>{data[index].name}</div>
        <div
          style={{
            width: '150px',
            justifySelf: 'center',
            backgroundColor: Math.round(data[index].value1) % 2 === 0 ? 'lime' : 'red',
            color: Math.round(data[index].value1) % 2 === 0 ? 'black' : 'white',
          }}
        >
          {data[index].value1}
        </div>
        <div
          style={{
            width: '150px',
            backgroundColor: Math.round(data[index].value2) % 2 === 0 ? 'lime' : 'red',
            color: Math.round(data[index].value2) % 2 === 0 ? 'black' : 'white',
          }}
        >
          {data[index].value2}
        </div>
        <div
          style={{
            width: '150px',
            backgroundColor: Math.round(data[index].value3) % 2 === 0 ? 'lime' : 'red',
            color: Math.round(data[index].value3) % 2 === 0 ? 'black' : 'white',
          }}
        >
          {data[index].value3}
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        style={{
          padding: '10px',
          width: '1000px',
          borderRadius: '5px',
          outline: 'none',
          border: '1px solid black',
        }}
        onClick={() => setPause((prev) => !prev)}
      >
        {isPause ? 'resume' : 'pause'}
      </button>
      <FixedSizeList
        outerRef={myRef}
        onScroll={() => {
          if (myRef.current) {
            const begin = Math.floor(myRef.current.scrollTop / ITEM_SIZE)
            const end = begin + 10 + (myRef.current.scrollTop % ITEM_SIZE === 0 ? 0 : 1)
            setRange({ begin, end })
          }
        }}
        style={{ backgroundColor: 'orange' }}
        height={500}
        itemData={data}
        itemCount={data.length}
        itemSize={ITEM_SIZE}
        width={1000}
      >
        {Row}
      </FixedSizeList>
      <p>C?? 2 l???i ??? ????y:</p>
      <p>
        1. FixedSizeList b??? r??ng bu???c gi???a itemSize v?? itemCount. V?? d???: N???u mu???n render ra 1,000,000 item th?? chi???u cao
        c???a m???i item kh??ng ???????c qu?? 33.5px.
      </p>
      <p>
        2. Gi?? tr??? th???c v?? gi?? tr??? in ra console c???a scrollTop kh??ng gi???ng nhau khi user drag scrollbar. V?? d???: User
        drag scrollbar xu???ng d?????i c??ng, ????ng ra range.end ph???i l?? 999,999 nh??ng n?? l???i l?? 670,000.
      </p>
      <blockquote>
        PS: T???i sao l???i x??c ?????nh ???????c gi?? tr??? th???c ????ng c??n gi?? tr??? in ra console sai? V?? data realtime t??? socket tr??? v???
        v???n gi??? ????ng d??ng, t???c l?? s??? &quot;999,999.42&quot; v???n nh???y li??n t???c th??nh: &quot;999,999.61&quot;,
        &quot;999,999.89&quot;...
      </blockquote>
      <blockquote>
        More PS: Mu???n click m???t ph??t xu???ng d??ng 200?
        https://codesandbox.io/s/bvaughnreact-window-fixed-size-list-vertical-wqmeo
      </blockquote>
    </div>
  )
}

"use client"

import { setInitalData } from "@/server/db"

export const SetDataBtn = () => {
  return (
    <button onClick={ setInitalData}>set data</button>
  )
}
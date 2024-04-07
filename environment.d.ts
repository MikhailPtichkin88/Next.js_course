declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DB_NAME: string
      DB_USER: string
      DB_HOST: string
      DB_PASSWORD: string
      DB_PORT: number
      PORT:number
    }
  }
}

export {};
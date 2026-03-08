import { create } from 'zustand'

export const useRoom = create((set) => ({
  players: [],
  settings: {},
  roomId: "",
  roomName: "",
  messages: [],
  myDetail: null,
  sktId: "",
  hostId:"",
  drawerId:"",
  drawWord:"",
  isChoosing:false,
  isPlaying:false,
  
  setPlayers: (players) => set({ players }),
  setSettings: (settings) => set({ settings }),
  setRoomId: (roomId) => set({ roomId }),
  setRoomName: (roomName) => set({ roomName }),
  setMessages: (messages) => set({ messages }),
  setMyDetail: (myDetail) => set({ myDetail }),
  setSktId: (sktId) => set({ sktId }),
  setHostId: (hostId) => set({ hostId }),
  setDrawerId: (drawerId) => set({ drawerId}),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsChoosing: (isChoosing) => set({ isChoosing }),
  setDrawWord: (drawWord) => set({drawWord}),
   
  
  resetRoom: () => set({
    players: [],
    settings: {},
    roomId: "",
    roomName: "",
    messages :[],
    myDetail :[],
    sktId:"",
    hostId:"",
    drawerId:"",
    drawWord:"",
  })
}))

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
  
  setPlayers: (players) => set({ players }),
  setSettings: (settings) => set({ settings }),
  setRoomId: (roomId) => set({ roomId }),
  setRoomName: (roomName) => set({ roomName }),
  setMessages: (messages) => set({ messages }),
  setMyDetail: (myDetail) => set({ myDetail }),
  setSktId: (sktId) => set({ sktId }),
  setHostId: (hostId) => set({ hostId }),
  
  
  
  resetRoom: () => set({
    players: [],
    settings: {},
    roomId: "",
    roomName: "",
    messages :[],
    myDetail :[],
    sktId:"",
    hostId:"",
  })
}))

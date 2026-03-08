import {createSlice} from "@reduxjs/toolkit"


const initialState={
    avatarUser:{name:"",colour:"red",eyes:"",smile:""},
    roomCreating:false
}

export const avatarSlice=createSlice({
    name:"avatar",
    initialState,
    reducers:{
        updateAvatar:(state,action)=>{
            state.avatarUser.name=action.payload.name
            state.avatarUser.colour=action.payload.colour
            state.avatarUser.eyes=action.payload.eyes
            state.avatarUser.smile=action.payload.smile
        },
        createRooom:(state,action)=>{
            state.roomCreating=action.payload
        }
    }
})

export const {updateAvatar,createRooom}=avatarSlice.actions
export default avatarSlice.reducer
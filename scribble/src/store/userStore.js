import {configureStore} from '@reduxjs/toolkit'
import avatarReducer from "../features/userDetail"

export const userStore=configureStore({
       reducer:avatarReducer,
})
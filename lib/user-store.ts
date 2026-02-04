import { create } from "zustand"

type UserProfile = {
  email: string
  firstName: string
  lastName: string
}

type UserStore = UserProfile & {
  setUserProfile: (profile: Partial<UserProfile>) => void
  clearUserProfile: () => void
}

const initialState: UserProfile = {
  email: "",
  firstName: "",
  lastName: "",
}

export const useUserStore = create<UserStore>((set) => ({
  ...initialState,
  setUserProfile: (profile) =>
    set((state) => ({
      ...state,
      ...profile,
    })),
  clearUserProfile: () => set(initialState),
}))

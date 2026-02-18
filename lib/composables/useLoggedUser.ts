import { useUserStore } from "../stores/user-store";

export default function useLoggedUser() {
  const getUserPictureURL = () => {
    const userStore = useUserStore();
    const user = userStore.getUser;
    if (!user) return "";
    return `${process.env.HTTP_API}/public-api/v1/users/${user.id}/profile/picture`;
  };

  return { getUserPictureURL };
}

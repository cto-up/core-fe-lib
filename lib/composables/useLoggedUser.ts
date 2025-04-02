export default function useLoggedUser() {
  const getUserPictureURL = () => {
    if (!localStorage.user) return '';
    const user = JSON.parse(localStorage.user);
    if (!user) return '';
    const userPictureURL = `${process.env.HTTP_API}/public-api/v1/users/${user.uid}/profile/picture`;
    return userPictureURL;
  };

  return { getUserPictureURL };
}

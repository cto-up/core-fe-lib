import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useQuasar } from 'quasar';
import { useTenantStore } from 'stores/tenant-store';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import  {useUrl}  from 'composables/useUrl';

export const useAuth = () => {
  const route = useRoute();
  const router = useRouter();

  const $q = useQuasar();
  const { t } = useI18n();

  const signMeIn = async (email: string, password: string) => {
    // Check if the route and router components are defined

    if (!route || !router) {
      // Return if the route or router components are undefined
      return;
    }

    const auth = getFirebaseAuth();
    signInWithEmailAndPassword(auth, email, password)
      .then((/*res*/) => {
        router.push((route.query['from'] ?? '/') as string);
      })
      .catch((err) => {
        $q.notify({
          type: 'negative',
          message: t(
            err.response?.data ? err.response.data?.message : err.message
          ),
        });
      });
  };

  const signMeOut = () => {
    if (!route || !router) {
      // Return if the route or router components are undefined
      return;
    }

    const auth = getFirebaseAuth();
    signOut(auth)
      .then(() => {
        router.push({ name: 'home' });
      })
      .catch((err) => {
        $q.notify({
          type: 'negative',
          message: t(
            err.response?.data ? err.response.data?.message : err.message
          ),
        });
      });
  };

  async function isLoggedIn(): Promise<boolean> {
    try {
      await new Promise((resolve, reject) =>
        getAuth().onAuthStateChanged(
          (user) => {
            if (user) {
              // User is signed in.
              resolve(user);
            } else {
              // No user is signed in.
              reject('no user logged in');
            }
          },
          // Prevent console error
          (error) => reject(error)
        )
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  function getFirebaseAuth() {
    const { isTenantSubdomain } = useUrl();
    const tenantStore = useTenantStore(); // tenantStore.tenantId =

    const auth = getAuth();
    if (isTenantSubdomain()) {
        console.log('using tenant id : ', tenantStore.tenant.tenant_id)
        auth.tenantId = tenantStore.tenant.tenant_id
    }
    return auth;
  }

  return {
    getFirebaseAuth,
    signMeIn,
    signMeOut,
    isLoggedIn,
  };
};



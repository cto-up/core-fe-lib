// composables/useUrl.ts
import { ref} from 'vue'
import { type LocationQueryValue, useRouter } from 'vue-router'

export interface QueryParams {
  [key: string]: LocationQueryValue | LocationQueryValue[] | null
}

export function useUrl() {
  const router = useRouter()
  const params = ref<QueryParams>({})

  const getSubdomain = () => {
    const host = window.location.host; // e.g., abc-shop.example.com
    const parts = host.split('.'); // Split into parts
    // Assuming the last two parts are the main domain and TLD
    if (parts.length > 2) {
        return parts.slice(0, -2).join('.'); // Join back any subdomains
    }
    return null; // No subdomain found
  };

  const isTenantSubdomain = () => {
     const subdomain = getSubdomain();
     return (subdomain && subdomain !== 'www')
  }

  /* watch(() => route.query, (newQuery) => {
    params.value = { ...newQuery }
  }, { immediate: true })*/

  function updateParams(newParams: QueryParams) {
    router.push({ query: { ...params.value, ...newParams } })
  }


  // connectionId: string
  // location: string
  const socketPath = (location: string, connectionId: string) => {
    const baseSocket = process.env.HTTP_API
    return `${baseSocket}/ws/channel/${location}/connections/${connectionId}`
  }
  return { params, socketPath, updateParams, getSubdomain, isTenantSubdomain }
}

import { useEffect } from 'react';

export function useSEO(title: string, description?: string) {
  useEffect(() => {
    // If the title is exactly "Moms Magic", don't duplicate the branding name
    document.title = title === "Moms Magic" ? "Moms Magic" : `${title} | Moms Magic`;

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }
  }, [title, description]);
}

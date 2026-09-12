import { useEffect } from 'react';

export function usePageTitle(title: string, description?: string) {
  useEffect(() => {
    document.title = `${title} | promote-IT Studio`;
    if (description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', description);
    }
  }, [title, description]);
}

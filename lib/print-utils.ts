export function printWithFilename(filename: string) {
  const originalTitle = document.title;
  document.title = filename;

  // Small delay to ensure the browser registers the title change
  setTimeout(() => {
    const restoreTitle = () => {
      if (document.title !== originalTitle) {
        document.title = originalTitle;
      }
      window.removeEventListener('afterprint', restoreTitle);
    };

    window.addEventListener('afterprint', restoreTitle);
    window.print();
  }, 100);
}

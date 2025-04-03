export default function useFormatter() {
  function formatFileSize(size: number) {
    const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
    return (
      +(size / Math.pow(1024, i)).toFixed(2) * 1 +
      ' ' +
      ['B', 'kB', 'MB', 'GB', 'TB'][i]
    );
  }

  const formatEllipsis = function (str: string, length: number) {
    if (str && str.length > length) {
      return str.substring(0, length) + '...';
    }
    return str;
  };


  return {
    formatEllipsis,
    formatFileSize,
  };
}

import { helpers } from '@vuelidate/validators';
import { date } from 'quasar';

export default function useDate() {
  const formatDate = (dateStr: string) => {
    return date.formatDate(dateStr, 'YYYY-MM-DD');
  };

  function addMinutesToDate(date: Date, minutes: number): Date {
    const dateObj = new Date(date.getTime() + minutes*60000);
    console.log(dateObj)
    return dateObj;
  }
  function calculateDurationInMinutes(fromDate: string, toDate: string): number {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const differenceInMilliseconds = to.getTime() - from.getTime();
    return Math.floor(differenceInMilliseconds / (1000 * 60)); // Convert milliseconds to minutes
  }
    function addDays(date: Date, days: number) {
      const result = new Date(date);
        result.setDate(result.getDate() + days);
      return result;
    }
    const DateDiff = {
      inDays: function(d1:Date, d2:Date) {
          const t2 = d2.getTime();
          const t1 = d1.getTime();

          return Math.floor((t2-t1)/(24*3600*1000));
      },

      inWeeks: function(d1:Date, d2:Date) {
        const t2 = d2.getTime();
        const t1 = d1.getTime();

          return (t2-t1)/(24*3600*1000*7);
      },

      inMonths: function(d1:Date, d2:Date) {
        const d1Y = d1.getFullYear();
        const d2Y = d2.getFullYear();
        const d1M = d1.getMonth();
        const d2M = d2.getMonth();
        return (d2M+12*d2Y)-(d1M+12*d1Y);
      },

      inYears: function(d1:Date, d2:Date) {
          return d2.getFullYear()-d1.getFullYear();
      }
  }

  const datetimeFormatRule = helpers.withMessage(
    'Date and time must be in the format YYYY-MM-DD HH:mm',
    (value: string) => /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value as string)
  );

  // input local datetime string"2024-10-15 11:00"
  // output ISO string "2024-10-15T12:00:00.000Z"
  function datetimeStringToISO(datetimeString: string) {
    if (!datetimeString) {
      return null;
    }

  // Split the datetime string into date and time components
  const [datePart, timePart] = datetimeString.split(' ');

    if (!datePart || !timePart) return ''; // Handle invalid format

    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    // Create a Date object using local time (Date takes month as 0-indexed)
    const date = new Date(year, month - 1, day, hours, minutes);

    if (isNaN(date.getTime())) return ''; // Handle invalid date

    // Convert to ISO string in UTC
    return date.toISOString();
  }

  // input ISO string "2024-10-15T12:00:00.000Z" or "2024-12-18T19:30:00+01:00"
  // output local datetime string "2024-10-15 10:00"
  function ISOStringToDateTimeString(isoString: string | null) {
    if (isoString) {
      const date = new Date(isoString);

      // Extract date parts
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
      const day = String(date.getDate()).padStart(2, '0');

      // Extract time parts
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      // Return formatted date as 'YYYY-MM-DD HH:MM'
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
    return ''
  }
// input ISO string "2024-10-15T12:00:00.000Z" or "2024-12-18T19:30:00+01:00"
  // output local datetime string "2024-10-15"
  function ISOStringToDateString(isoString: string | null) {
    if (isoString) {
      const date = new Date(isoString);

      // Extract date parts
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
      const day = String(date.getDate()).padStart(2, '0');

      // Return formatted date as 'YYYY-MM-DD'
      return `${year}-${month}-${day}`;
    }
    return ''
  }


  // input ISO string "2024-10-15T12:00:00.000Z" or "2024-12-18T19:30:00+01:00"
  function isDatePassed(isoString: string): boolean {
    const inputDate = new Date(isoString);
    const now = new Date();
    const isInPassed = inputDate.getTime() < now.getTime();
    return isInPassed;
  }
  function ISODateToDateString(date: Date) {
    return date.toISOString().split('T')[0]
  }

    return {
      addMinutesToDate,
      calculateDurationInMinutes,
      datetimeFormatRule,
      ISOStringToDateTimeString,
      ISOStringToDateString,
      datetimeStringToISO,
      ISODateToDateString,
      addDays,
      isDatePassed,
      DateDiff,
      formatDate,
  };
}


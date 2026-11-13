/** Normaliserer Intl sine harde mellomrom til vanlige mellomrom i tester. */
export const sp = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ')

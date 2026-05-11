import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/** Native flat config from eslint-config-next (avoid FlatCompat + ESLint 9 circular JSON bug). */
export default [...nextCoreWebVitals, ...nextTypescript];

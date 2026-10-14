// Preguntas tipo "¿qué imprime?". Piensa la respuesta ANTES de revelarla.

export type Quiz = {
  id: string;
  topic: 'var/let/const' | 'Hoisting' | 'NaN/null/undefined' | 'Coerción' | 'Closures y this';
  code: string;
  answer: string;
  explanation: string;
};

export const quizzes: Quiz[] = [
  // ---------- var / let / const ----------
  {
    id: 'scope-loop',
    topic: 'var/let/const',
    code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i));
}
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j));
}`,
    answer: '3 3 3, luego 0 1 2',
    explanation:
      'var tiene alcance de función: los tres callbacks comparten la MISMA variable i, que vale 3 cuando se ejecutan. let crea una variable nueva por cada iteración del bucle, así que cada closure captura su propio j.',
  },
  {
    id: 'block-scope',
    topic: 'var/let/const',
    code: `if (true) {
  var a = 1;
  let b = 2;
}
console.log(a);
console.log(b);`,
    answer: '1, luego ReferenceError: b is not defined',
    explanation:
      'var ignora los bloques { } (solo respeta funciones), así que a "se escapa" del if. let y const tienen alcance de bloque.',
  },
  {
    id: 'const-mutation',
    topic: 'var/let/const',
    code: `const user = { name: 'Ana' };
user.name = 'Luis';
console.log(user.name);
user = { name: 'Eva' };`,
    answer: "'Luis', luego TypeError: Assignment to constant variable",
    explanation:
      'const impide REASIGNAR el binding, no mutar el objeto. Para inmutabilidad superficial usa Object.freeze; para inmutabilidad profunda, librerías o convenciones (Immer, spread).',
  },
  {
    id: 'redeclare',
    topic: 'var/let/const',
    code: `var x = 1;
var x = 2;
console.log(x);

let y = 1;
let y = 2;`,
    answer: 'Nada: SyntaxError: Identifier \'y\' has already been declared',
    explanation:
      'var permite redeclarar en el mismo ámbito (fuente clásica de bugs); sin las dos últimas líneas imprimiría 2. let/const no lo permiten, y el SyntaxError ocurre al PARSEAR el script, antes de ejecutar cualquier línea: ni siquiera el console.log(x) llega a correr.',
  },
  {
    id: 'global-this',
    topic: 'var/let/const',
    code: `// en un <script> del navegador, fuera de módulos
var a = 1;
let b = 2;
console.log(window.a, window.b);`,
    answer: '1 undefined',
    explanation:
      'var en el ámbito global crea una propiedad en el objeto global (window). let/const viven en un "declarative environment" y no se cuelgan de window.',
  },

  // ---------- Hoisting ----------
  {
    id: 'hoist-var',
    topic: 'Hoisting',
    code: `console.log(x);
var x = 5;
console.log(x);`,
    answer: 'undefined, luego 5',
    explanation:
      'La DECLARACIÓN var x se eleva al inicio y se inicializa con undefined; la ASIGNACIÓN = 5 se queda en su lugar.',
  },
  {
    id: 'hoist-tdz',
    topic: 'Hoisting',
    code: `console.log(y);
let y = 5;`,
    answer: 'ReferenceError: Cannot access \'y\' before initialization',
    explanation:
      'let/const TAMBIÉN se elevan, pero no se inicializan: desde el inicio del bloque hasta la declaración están en la Temporal Dead Zone (TDZ). Por eso el error dice "before initialization" y no "is not defined".',
  },
  {
    id: 'hoist-fn-decl',
    topic: 'Hoisting',
    code: `saludar();
function saludar() {
  console.log('hola');
}`,
    answer: "'hola'",
    explanation:
      'Las function declarations se elevan COMPLETAS (nombre + cuerpo), así que se pueden llamar antes de aparecer en el código.',
  },
  {
    id: 'hoist-fn-expr',
    topic: 'Hoisting',
    code: `despedir();
var despedir = function () {
  console.log('adiós');
};`,
    answer: 'TypeError: despedir is not a function',
    explanation:
      'Solo se eleva "var despedir" (con valor undefined). Llamar a undefined() da TypeError. Con const/let sería ReferenceError por la TDZ.',
  },
  {
    id: 'hoist-shadow',
    topic: 'Hoisting',
    code: `var a = 1;
function f() {
  console.log(a);
  var a = 2;
}
f();`,
    answer: 'undefined',
    explanation:
      'Dentro de f existe una var a local que se eleva al inicio de f y "tapa" (shadowing) a la global. En el console.log la local todavía es undefined.',
  },
  {
    id: 'hoist-class',
    topic: 'Hoisting',
    code: `const p = new Persona();
class Persona {}`,
    answer: 'ReferenceError: Cannot access \'Persona\' before initialization',
    explanation: 'Las clases se comportan como let: se elevan pero quedan en la TDZ.',
  },

  // ---------- NaN / null / undefined ----------
  {
    id: 'typeof',
    topic: 'NaN/null/undefined',
    code: `console.log(typeof null);
console.log(typeof undefined);
console.log(typeof NaN);
console.log(typeof noDeclarada);`,
    answer: "'object', 'undefined', 'number', 'undefined'",
    explanation:
      "typeof null === 'object' es un bug histórico de JS. NaN es de tipo number ('Not a Number' es un valor numérico). typeof sobre una variable no declarada no lanza error.",
  },
  {
    id: 'nan-equality',
    topic: 'NaN/null/undefined',
    code: `console.log(NaN === NaN);
console.log(Number.isNaN(NaN));
console.log(isNaN('hola'));
console.log(Number.isNaN('hola'));
console.log(Object.is(NaN, NaN));`,
    answer: 'false, true, true, false, true',
    explanation:
      'NaN es el único valor que no es igual a sí mismo. isNaN() global convierte primero a número (\'hola\' → NaN → true). Number.isNaN no convierte: solo es true si el valor ES NaN. Object.is usa "SameValue".',
  },
  {
    id: 'null-undefined-eq',
    topic: 'NaN/null/undefined',
    code: `console.log(null == undefined);
console.log(null === undefined);
console.log(null == 0);
console.log(null >= 0);`,
    answer: 'true, false, false, true',
    explanation:
      '== tiene una regla especial: null y undefined solo son iguales entre sí. Pero los operadores relacionales (>=) SÍ convierten null a 0, por eso null >= 0 es true. Usa === siempre.',
  },
  {
    id: 'null-math',
    topic: 'NaN/null/undefined',
    code: `console.log(null + 1);
console.log(undefined + 1);
console.log(Number(null), Number(undefined), Number(''));`,
    answer: '1, NaN, 0 NaN 0',
    explanation:
      'null se convierte a 0 en contextos numéricos; undefined a NaN. La cadena vacía también se convierte a 0.',
  },
  {
    id: 'nullish',
    topic: 'NaN/null/undefined',
    code: `const a = 0 || 10;
const b = 0 ?? 10;
const c = '' || 'def';
const d = '' ?? 'def';
const e = null ?? 'def';
console.log(a, b, c, d, e);`,
    answer: "10 0 'def' '' 'def'",
    explanation:
      '|| usa el valor de la derecha ante cualquier falsy (0, \'\', false, NaN, null, undefined). ?? (nullish coalescing) solo ante null o undefined. Úsalo para defaults donde 0 o \'\' son válidos.',
  },
  {
    id: 'optional-chaining',
    topic: 'NaN/null/undefined',
    code: `const user = { profile: null };
console.log(user.profile?.name);
console.log(user.settings?.theme ?? 'light');
console.log(user.profile.name);`,
    answer: "undefined, 'light', TypeError: Cannot read properties of null",
    explanation:
      '?. corta la evaluación y devuelve undefined si lo de la izquierda es null/undefined. Combínalo con ?? para valores por defecto.',
  },
  {
    id: 'includes-nan',
    topic: 'NaN/null/undefined',
    code: `console.log([NaN].includes(NaN));
console.log([NaN].indexOf(NaN));`,
    answer: 'true, -1',
    explanation:
      'includes usa "SameValueZero" (considera NaN igual a NaN). indexOf usa === y por lo tanto nunca encuentra NaN.',
  },
  {
    id: 'undefined-vs-null',
    topic: 'NaN/null/undefined',
    code: `function f(x = 'default') { return x; }
console.log(f(undefined));
console.log(f(null));
console.log(JSON.stringify({ a: undefined, b: null }));`,
    answer: `'default', null, '{"b":null}'`,
    explanation:
      'Los parámetros por defecto solo se aplican con undefined. JSON.stringify omite las propiedades undefined pero conserva null. Semántica: undefined = "no se asignó", null = "vacío a propósito".',
  },

  // ---------- Coerción ----------
  {
    id: 'plus-minus',
    topic: 'Coerción',
    code: `console.log('5' + 2);
console.log('5' - 2);
console.log('5' * '2');
console.log(true + 1);
console.log([] + []);
console.log([] + {});`,
    answer: "'52', 3, 10, 2, '', '[object Object]'",
    explanation:
      '+ con un string concatena. -, * y / siempre convierten a número. Los arrays/objetos se convierten a primitivo con toString(): [] → \'\', {} → \'[object Object]\'.',
  },
  {
    id: 'truthy',
    topic: 'Coerción',
    code: `console.log(Boolean([]), Boolean({}), Boolean('0'));
console.log(Boolean(0), Boolean(''), Boolean(NaN));
console.log([] == false);`,
    answer: 'true true true, false false false, true',
    explanation:
      'Solo hay 8 valores falsy: false, 0, -0, 0n, \'\', null, undefined, NaN. Todo lo demás es truthy (incluidos [] y {}). Pero [] == false es true porque == convierte ambos a número: [] → \'\' → 0.',
  },

  // ---------- Closures y this ----------
  {
    id: 'closure-counter',
    topic: 'Closures y this',
    code: `function crearContador() {
  let n = 0;
  return () => ++n;
}
const a = crearContador();
const b = crearContador();
console.log(a(), a(), b());`,
    answer: '1 2 1',
    explanation:
      'Cada llamada a crearContador crea un nuevo ámbito con su propia n. La función devuelta la "recuerda" (closure). a y b no comparten estado.',
  },
  {
    id: 'this-arrow',
    topic: 'Closures y this',
    code: `const obj = {
  name: 'obj',
  normal() { return this.name; },
  arrow: () => this?.name,
};
const f = obj.normal;
console.log(obj.normal());
console.log(obj.arrow());
console.log(f());`,
    answer: "'obj', undefined, TypeError: Cannot read properties of undefined",
    explanation:
      'this en funciones normales depende de CÓMO se llaman (obj.normal() → obj). Al extraerla a f pierde el contexto: en un módulo (strict mode) this es undefined y this.name lanza error; en modo no estricto sería el objeto global. Las arrow functions no tienen this propio: usan el del ámbito léxico donde se definieron (aquí, el módulo, donde this es undefined).',
  },
];

// Teoría de la pantalla "Fundamentos de JS" (modo Aprender).
// Cada tema tiene tarjetas; cada tarjeta es una lista de bloques (párrafo, viñetas, tabla, código).

import type { Quiz } from './quizzes';

export type TheoryBlock =
  | { type: 'p'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'code'; code: string }
  | { type: 'tip'; text: string };

export type TheoryCard = { title: string; blocks: TheoryBlock[] };

export const theory: Record<Quiz['topic'], TheoryCard[]> = {
  // -------------------------------------------------------------------------
  'var/let/const': [
    {
      title: '¿Qué es una variable?',
      blocks: [
        {
          type: 'p',
          text: 'Una variable es un nombre que apunta a un valor guardado en memoria. En JavaScript se declara con una de tres palabras: var, let o const. Las tres sirven para lo mismo (guardar un valor), pero se comportan distinto en tres aspectos:',
        },
        {
          type: 'bullets',
          items: [
            'Scope (alcance): desde qué partes del código se puede ver la variable.',
            'Hoisting: qué pasa si la usas antes de la línea donde la declaraste.',
            'Reasignación y redeclaración: si puedes cambiarle el valor o volver a declararla.',
          ],
        },
      ],
    },
    {
      title: 'var (la forma antigua)',
      blocks: [
        {
          type: 'p',
          text: 'Fue la única forma de declarar variables hasta ES6 (2015). Hoy se evita porque su comportamiento provoca bugs difíciles de ver.',
        },
        {
          type: 'bullets',
          items: [
            'Scope de FUNCIÓN: ignora los bloques { } de if, for y while. Si la declaras dentro de un if, existe en toda la función.',
            'Hoisting con undefined: se puede usar antes de declararla y vale undefined (no da error, lo que oculta bugs).',
            'Se puede REDECLARAR: var x = 1; var x = 2; no da error.',
            'Se puede REASIGNAR: x = 3.',
            'En el ámbito global crea una propiedad en window (navegador).',
          ],
        },
        {
          type: 'code',
          code: `function ejemplo() {
  if (true) {
    var mensaje = 'hola';
  }
  console.log(mensaje); // 'hola' → se "escapó" del if
}`,
        },
        { type: 'tip', text: 'Cuándo usarla: nunca en código nuevo. Solo para entender código viejo.' },
      ],
    },
    {
      title: 'let (variable que cambia)',
      blocks: [
        {
          type: 'p',
          text: 'Llegó en ES6 para reemplazar a var. Úsala cuando el valor de la variable VA A CAMBIAR.',
        },
        {
          type: 'bullets',
          items: [
            'Scope de BLOQUE: solo existe dentro de las { } donde se declaró.',
            'Hoisting con TDZ: se "eleva", pero usarla antes de su línea lanza ReferenceError (Temporal Dead Zone).',
            'NO se puede redeclarar en el mismo scope (SyntaxError).',
            'Se puede REASIGNAR.',
            'En un for, crea una variable NUEVA en cada vuelta (por eso funciona bien con setTimeout y closures).',
          ],
        },
        {
          type: 'code',
          code: `let contador = 0;
contador = contador + 1;   // ✅ reasignar está permitido

if (true) {
  let interno = 'solo aquí';
}
console.log(interno);      // ❌ ReferenceError`,
        },
        { type: 'tip', text: 'Cuándo usarla: contadores, acumuladores, valores que se recalculan en un bucle.' },
      ],
    },
    {
      title: 'const (variable que no se reasigna)',
      blocks: [
        {
          type: 'p',
          text: 'También de ES6. Declara una variable que NO se puede reasignar. Es la opción por defecto en código moderno.',
        },
        {
          type: 'bullets',
          items: [
            'Scope de BLOQUE (igual que let).',
            'Hoisting con TDZ (igual que let).',
            'NO se puede redeclarar.',
            'NO se puede REASIGNAR: intentar const x = 1; x = 2; lanza TypeError.',
            'Hay que darle un valor al declararla: const x; es un SyntaxError.',
          ],
        },
        {
          type: 'p',
          text: '⚠️ La trampa más común: const NO hace inmutable el valor. Impide cambiar a qué apunta la variable, pero si el valor es un objeto o un array, su CONTENIDO sí se puede modificar.',
        },
        {
          type: 'code',
          code: `const usuario = { nombre: 'Ana' };
usuario.nombre = 'Luis';   // ✅ modificar el contenido está permitido
usuario = {};              // ❌ TypeError: reasignar no

const lista = [1, 2];
lista.push(3);             // ✅ [1, 2, 3]`,
        },
        { type: 'tip', text: 'Cuándo usarla: siempre que no necesites reasignar (la gran mayoría de los casos).' },
      ],
    },
    {
      title: 'Comparación',
      blocks: [
        {
          type: 'table',
          headers: ['', 'var', 'let', 'const'],
          rows: [
            ['Scope', 'Función', 'Bloque', 'Bloque'],
            ['Usar antes de declarar', 'undefined', 'ReferenceError', 'ReferenceError'],
            ['Redeclarar', 'Sí', 'No', 'No'],
            ['Reasignar', 'Sí', 'Sí', 'No'],
            ['Valor inicial obligatorio', 'No', 'No', 'Sí'],
          ],
        },
        {
          type: 'tip',
          text: 'Regla práctica: const por defecto, let cuando necesites reasignar, var nunca.',
        },
      ],
    },
  ],

  // -------------------------------------------------------------------------
  Hoisting: [
    {
      title: '¿Qué es el hoisting?',
      blocks: [
        {
          type: 'p',
          text: 'Hoisting ("elevación") es el comportamiento por el que JavaScript registra las declaraciones al inicio de su scope ANTES de ejecutar el código. Parece como si las declaraciones se "subieran" al principio.',
        },
        {
          type: 'p',
          text: 'Pasa porque el motor procesa el código en dos fases: primero la fase de CREACIÓN (lee todas las declaraciones y reserva su espacio) y después la fase de EJECUCIÓN (corre el código línea por línea).',
        },
        {
          type: 'p',
          text: 'Importante: solo se eleva la DECLARACIÓN, no la asignación. En var x = 5, se eleva "var x", pero el "= 5" se queda en su lugar.',
        },
      ],
    },
    {
      title: 'Cómo se eleva cada cosa',
      blocks: [
        {
          type: 'table',
          headers: ['Declaración', 'Antes de su línea'],
          rows: [
            ['var x = 1', 'Existe y vale undefined'],
            ['let / const', 'Existe pero en TDZ → ReferenceError'],
            ['function f() {}', 'Se eleva COMPLETA: ya se puede llamar'],
            ['var f = function () {}', 'f vale undefined → TypeError al llamarla'],
            ['const f = () => {}', 'TDZ → ReferenceError'],
            ['class A {}', 'TDZ → ReferenceError'],
          ],
        },
        {
          type: 'code',
          code: `console.log(a);   // undefined
var a = 5;

saludar();        // 'hola' ✅
function saludar() { console.log('hola'); }

console.log(b);   // ❌ ReferenceError
let b = 5;`,
        },
      ],
    },
    {
      title: 'TDZ (Temporal Dead Zone)',
      blocks: [
        {
          type: 'p',
          text: 'Es el tramo de código entre el inicio del bloque y la línea donde se declara un let, const o class. En ese tramo la variable YA existe (fue elevada), pero no se puede leer ni escribir.',
        },
        {
          type: 'p',
          text: 'Por eso el error dice "Cannot access \'b\' before initialization" y no "b is not defined": JavaScript sabe que existe, pero todavía no está lista.',
        },
        {
          type: 'tip',
          text: '¿Para qué existe? Para que usar una variable antes de tiempo sea un error visible, en lugar de un undefined silencioso como con var.',
        },
      ],
    },
  ],

  // -------------------------------------------------------------------------
  'NaN/null/undefined': [
    {
      title: 'undefined: "no tiene valor asignado"',
      blocks: [
        {
          type: 'p',
          text: 'Es el valor que JavaScript pone AUTOMÁTICAMENTE cuando algo existe pero todavía no tiene un valor. Normalmente no lo asignas tú.',
        },
        {
          type: 'bullets',
          items: [
            'Una variable declarada sin valor: let x; → undefined',
            'Una propiedad que no existe: ({}).nombre → undefined',
            'Un parámetro que no se pasó: function f(a) {} f(); → a es undefined',
            'Una función sin return devuelve undefined',
            'typeof undefined → \'undefined\'',
          ],
        },
        {
          type: 'code',
          code: `let x;
console.log(x);            // undefined
const user = {};
console.log(user.edad);    // undefined`,
        },
      ],
    },
    {
      title: 'null: "vacío a propósito"',
      blocks: [
        {
          type: 'p',
          text: 'Es un valor que asignas TÚ, de forma intencional, para decir "aquí no hay nada". Representa la ausencia deliberada de un objeto.',
        },
        {
          type: 'bullets',
          items: [
            'Ejemplos: un usuario que cerró sesión (user = null), un resultado de búsqueda sin coincidencias, limpiar una referencia.',
            'typeof null → \'object\'. Es un bug histórico de JavaScript que nunca se corrigió para no romper la web.',
            'En operaciones numéricas se convierte a 0: null + 1 → 1.',
          ],
        },
        {
          type: 'code',
          code: `let usuarioActual = { nombre: 'Ana' };
usuarioActual = null;      // cerró sesión: vacío a propósito`,
        },
      ],
    },
    {
      title: 'NaN: "no es un número válido"',
      blocks: [
        {
          type: 'p',
          text: 'NaN significa "Not a Number", pero curiosamente ES de tipo number (typeof NaN → \'number\'). Es el resultado de una operación matemática que no tiene un resultado numérico válido.',
        },
        {
          type: 'bullets',
          items: [
            'Number(\'hola\') → NaN',
            'undefined + 1 → NaN',
            'Math.sqrt(-1) → NaN',
            '0 / 0 → NaN',
            'Es "contagioso": cualquier operación con NaN da NaN.',
            'Es el ÚNICO valor que no es igual a sí mismo: NaN === NaN → false.',
          ],
        },
        {
          type: 'p',
          text: 'Cómo detectarlo: usa Number.isNaN(x). Evita isNaN(x) (sin "Number."), porque primero convierte a número: isNaN(\'hola\') da true aunque \'hola\' no sea NaN.',
        },
        {
          type: 'code',
          code: `const precio = Number('abc');   // NaN
precio === NaN;                 // false ❌ nunca funciona
Number.isNaN(precio);           // true ✅`,
        },
      ],
    },
    {
      title: 'Comparación y operadores útiles',
      blocks: [
        {
          type: 'table',
          headers: ['', 'undefined', 'null', 'NaN'],
          rows: [
            ['Significado', 'Sin asignar', 'Vacío a propósito', 'Número inválido'],
            ['Quién lo pone', 'JavaScript', 'El programador', 'Una operación'],
            ['typeof', "'undefined'", "'object'", "'number'"],
            ['Number(x)', 'NaN', '0', 'NaN'],
            ['x === x', 'true', 'true', 'false'],
          ],
        },
        {
          type: 'p',
          text: 'null == undefined es true (regla especial de ==), pero null === undefined es false. Usa siempre ===.',
        },
        {
          type: 'code',
          code: `// ?? : valor por defecto SOLO si es null o undefined
const edad = 0;
edad || 18;   // 18  ← || reemplaza cualquier falsy (incluido 0)
edad ?? 18;   // 0   ← ?? respeta el 0 ✅

// ?. : acceder sin error si algo es null/undefined
user?.direccion?.ciudad;   // undefined en lugar de TypeError`,
        },
      ],
    },
  ],

  // -------------------------------------------------------------------------
  Coerción: [
    {
      title: '¿Qué es la coerción?',
      blocks: [
        {
          type: 'p',
          text: 'Es la conversión AUTOMÁTICA de un tipo a otro que hace JavaScript cuando operas con valores de tipos distintos. Por ejemplo, al sumar un string y un número.',
        },
        {
          type: 'bullets',
          items: [
            'Implícita: la hace JavaScript solo ("5" - 2 → 3).',
            'Explícita: la haces tú a propósito (Number("5"), String(5), Boolean(x)).',
          ],
        },
      ],
    },
    {
      title: 'Reglas principales',
      blocks: [
        {
          type: 'bullets',
          items: [
            '+ con un string CONCATENA: "5" + 2 → "52".',
            '-, *, / y % siempre convierten a número: "5" - 2 → 3.',
            'Los objetos y arrays se convierten a primitivo con toString(): [] → "", {} → "[object Object]".',
            '== convierte los tipos antes de comparar; === NO convierte (compara tipo y valor).',
          ],
        },
        {
          type: 'code',
          code: `'5' + 2      // '52'
'5' - 2      // 3
true + 1     // 2
'5' == 5     // true  (convierte)
'5' === 5    // false (no convierte) ✅`,
        },
      ],
    },
    {
      title: 'Truthy y falsy',
      blocks: [
        {
          type: 'p',
          text: 'En un if, en && / || o en !, cualquier valor se convierte a booleano. Solo hay 8 valores falsy; TODO lo demás es truthy.',
        },
        {
          type: 'table',
          headers: ['Falsy (8)', 'Truthy (ejemplos que confunden)'],
          rows: [
            ['false', '[] (array vacío)'],
            ['0 y -0', '{} (objeto vacío)'],
            ['0n (BigInt)', "'0' (string con un cero)"],
            ["'' (string vacío)", "'false' (string)"],
            ['null', '-1'],
            ['undefined', 'Infinity'],
            ['NaN', 'cualquier función'],
          ],
        },
        {
          type: 'tip',
          text: 'Regla para la entrevista: "Uso siempre ===. Solo uso == a propósito en x == null, para cubrir null y undefined a la vez."',
        },
      ],
    },
  ],

  // -------------------------------------------------------------------------
  'Closures y this': [
    {
      title: 'Scope: dónde vive una variable',
      blocks: [
        {
          type: 'p',
          text: 'El scope es la región del código donde una variable existe. Hay cuatro tipos: global, de módulo (cada archivo), de función y de bloque ({ }).',
        },
        {
          type: 'p',
          text: 'JavaScript usa scope LÉXICO: lo que una función puede ver depende de DÓNDE está escrita, no de dónde se la llama. Si una variable no está en el scope actual, se busca en el que lo contiene, y así hasta el global (cadena de scopes).',
        },
      ],
    },
    {
      title: 'Closure',
      blocks: [
        {
          type: 'p',
          text: 'Un closure es una función junto con las variables del scope donde se CREÓ. La función las sigue recordando y usando aunque ese scope ya haya terminado.',
        },
        {
          type: 'code',
          code: `function crearContador() {
  let cuenta = 0;          // privada
  return () => ++cuenta;   // la función "encierra" a cuenta
}
const contar = crearContador();
contar(); // 1
contar(); // 2  → cuenta sigue viva`,
        },
        {
          type: 'bullets',
          items: [
            'Guarda una REFERENCIA a la variable, no una copia de su valor.',
            'Usos: datos privados, debounce, memoize, callbacks y hooks de React.',
            'Trampa en React: el "stale closure", una función que ve valores de un render viejo.',
          ],
        },
        {
          type: 'tip',
          text: 'Hay demos en vivo de todo esto en la pantalla "Scope y closures".',
        },
      ],
    },
    {
      title: 'this',
      blocks: [
        {
          type: 'p',
          text: 'this es el "contexto" de una función. A diferencia del scope, NO depende de dónde se escribió la función, sino de CÓMO se llama.',
        },
        {
          type: 'table',
          headers: ['Cómo se llama', 'this vale'],
          rows: [
            ['obj.metodo()', 'obj'],
            ['f() suelta', 'undefined (strict mode) o el objeto global'],
            ['new F()', 'el objeto nuevo'],
            ['f.call(x) / f.bind(x)', 'x'],
            ['Arrow function', 'el this del lugar donde se definió'],
          ],
        },
        {
          type: 'tip',
          text: 'Las arrow functions no tienen this propio: lo toman del scope donde se escribieron (como un closure).',
        },
      ],
    },
  ],
};

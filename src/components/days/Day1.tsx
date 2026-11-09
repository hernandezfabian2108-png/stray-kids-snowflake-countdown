import { EnvelopeLetter } from "./EnvelopeLetter";

export function Day1() {
  return (
    <EnvelopeLetter>
      <p>
        Diciembre ya está aquí y no quería que fuera un mes cualquiera. Diseñé y construí este
        pequeño rincón virtual pensado únicamente en ti, para sacarte una sonrisa cada día mientras
        esperamos la Navidad.
      </p>
      <p>
        Sé lo mucho que significan estas fechas y lo especial que es este mes, así que a partir de
        hoy, 1 de diciembre, cada puerta guarda un secreto diferente. Algunas puertas te traerán
        recuerdos, otras un juego, un reto o una pequeña sorpresa para divertirte un rato. La única
        regla es la paciencia: solo se abre una puerta por día.
      </p>
      <p>
        Espero que disfrutes explorando este espacio tanto como yo disfruté creándolo para ti.
        Prepárate, ponte cómoda y que comience la cuenta regresiva.
      </p>
      <p className="letter-sign">Con todo mi amor, feliz inicio de diciembre.</p>
      <p className="letter-ps">(PD: ¡Que lo disfrutes mucho, mi STAY favorita!)</p>
    </EnvelopeLetter>
  );
}

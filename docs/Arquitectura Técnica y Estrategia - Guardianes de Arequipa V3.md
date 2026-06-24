# **Arquitectura Técnica y Estrategia de Datos: Guardianes de Arequipa (V3)**

Este documento consolidado abarca la arquitectura tecnológica, la optimización de medios, la estrategia de tolerancia a fallos de red, el esquema relacional de la base de datos, la escalabilidad del sistema y las consideraciones prácticas de infraestructura para la plataforma web del concurso.

## **1\. Estrategia de Almacenamiento y Optimización de Imágenes**

### **1.1 Conversión a WebP en el Frontend**

Para mitigar los problemas de conexión causados por los gruesos muros de sillar en el centro histórico, la aplicación web comprimirá las evidencias fotográficas directamente en el celular del alumno antes de la subida a la nube.

* **Ahorro masivo de datos:** Una fotografía original de 5 MB a 10 MB se reduce drásticamente a un peso de 200 KB a 500 KB utilizando un elemento canvas de HTML5 en la aplicación Next.js.  
* **Resiliencia en subidas:** Subir 300 KB con una señal débil es un proceso casi instantáneo, mientras que intentar subir 8 MB resultaría en un error de timeout que frustraría al equipo.  
* **Reducción de estrés en el servidor:** Se elimina la necesidad de emplear Edge Functions pesadas para el procesamiento de imágenes en la nube.

## **2\. Estrategia de Sincronización Offline-Tolerant (Adaptada para Web)**

Al ser una aplicación web alojada en Vercel, la tolerancia a fallos se apoya en el uso estratégico del almacenamiento del navegador.

* **Gestión de Estados (Caché Local):** Un Service Worker descargará silenciosamente y guardará en IndexedDB la lista de misiones y preguntas en formato texto aprovechando una conexión estable.  
* **Interfaz de Usuario Optimista (UI Optimista):** Si un alumno responde sin conexión a internet, la aplicación asume un envío exitoso, muestra confeti y suma los puntos localmente de inmediato para no interrumpir la experiencia. Internamente, el registro se guarda con un estado temporal de pendiente.  
* **Cola de Sincronización en Segundo Plano:** Al recuperar la señal de red (ej. 4G), el Service Worker enviará primero las respuestas de texto ligero y procesará las evidencias fotográficas pesadas al final.

## **2.1. Explicación detallada: Service Workers, IndexedDB y UI Optimista**

**El Escenario:** Imagina al "Equipo A". Están en su colegio, donde tienen conexión Wi-Fi, y abren la página web del concurso en su celular.

1. **El "Service Worker" (El Intermediario):** En cuanto abren la web, un pequeño programa llamado Service Worker se instala en el navegador del celular de forma invisible. Su trabajo es interceptar todas las peticiones de red.  
2. **Guardado en "IndexedDB" (La Mochila Local):** Aprovechando el Wi-Fi del colegio, el Service Worker descarga silenciosamente el texto de todas las misiones del Capítulo I (ej. la pregunta sobre los arcos en la Plaza de Armas) y las guarda en IndexedDB. IndexedDB es, básicamente, una base de datos real que vive *dentro* del navegador Chrome/Safari del celular, sin necesidad de internet.  
3. **El momento sin conexión:** El equipo llega a la Catedral. Por la cantidad de gente y los muros, el celular pierde la señal. Sin embargo, cuando el alumno escanea el póster físico, la web no muestra un dinosaurio de "Sin conexión". El Service Worker dice: *"No hay internet, pero no importa, tengo la pregunta guardada en la mochila (IndexedDB)"*. Y la muestra al instante.  
4. **La "Edición Optimista" (UI Optimista):** El equipo lee la pregunta: *"¿Cómo se llama el material de construcción...?"* y seleccionan **Sillar**. Al darle a "Enviar", la web sabe que no hay internet. Pero en lugar de mostrar un error de "Cargando..." infinito, la aplicación web asume que el envío fue exitoso mediante una estrategia de "Edición Optimista".  
5. **Reacción inmediata:** La interfaz mostrará la suma de puntos localmente para no interrumpir la experiencia del alumno. Aparece confeti en la pantalla y el equipo celebra.  
6. **El registro oculto:** Internamente, el registro de esa respuesta correcta se guardará en IndexedDB con un estado local temporal (ej. "pendiente\_de\_envio").  
7. **La sincronización final:** El equipo sale de la plaza y camina hacia una calle abierta. El Service Worker detecta que regresó el 4G e, invisiblemente, manda esa respuesta guardada a la base de datos de Supabase.

De esta forma, la tecnología se vuelve invisible y los alumnos solo se concentran en la historia y en Arequipa.

## **3\. Entornos de Trabajo Separados**

Para proteger el evento en vivo y evitar que errores estructurales afecten a los colegios participantes, se manejará la base de datos como código sin intervención manual directa en producción.

* **Guardianes-Staging:** Un entorno de pruebas conectado a los "Preview Deployments" de Vercel y poblado con datos falsos mediante un script "Seed".  
* **Guardianes-Production:** El ambiente real conectado al dominio oficial, estrictamente protegido con políticas RLS.

## **5\. Optimización de Recursos y Escalabilidad**

Para soportar la concurrencia masiva de usuarios y tableros simultáneos, se implementará lo siguiente:

* **Índices Estratégicos:** Índices en colegio\_id, capitulo\_id, y un compuesto en equipo\_id \+ mision\_id para búsquedas instantáneas y resolución de conflictos.  
* **Caché con Redis/Upstash:** Para operaciones de lectura pesada (ranking general). Se refrescará automáticamente cada 15-30 segundos para dar sensación de tiempo real sin saturar la base.  
* **Database Triggers:** El cálculo de puntajes se realizará directamente en el motor de base de datos en milisegundos tras validar una misión, evitando sobrecargar Vercel.

## **6\. Estrategia de Autenticación Offline y Connection Pooling (Ejemplos Prácticos)**

Esta sección detalla cómo configurar la plataforma para evitar cuellos de botella y asegurar que cualquier usuario, incluso sin conocimientos avanzados, comprenda el funcionamiento de la infraestructura en situaciones críticas durante el evento.

### **6.1. El "Bouncer" de la Base de Datos (Connection Pooling con Supavisor)**

**El Problema:** Si 1,000 alumnos presionan "Enviar" al mismo tiempo, Vercel intentará abrir 1,000 conexiones directas a la base de datos PostgreSQL. La base de datos, por defecto, se abrumará y colapsará mostrando un error a los usuarios.  
**La Solución Explicada:** Imagina que la base de datos es una discoteca exclusiva y los alumnos enviando respuestas son personas intentando entrar. Si todos empujan la puerta a la vez, nadie entra y la puerta se rompe. Necesitamos un "Bouncer" o Cadenero. Este Bouncer organiza a las personas en una fila rápida y ordenada y las deja pasar eficientemente. En Supabase, este bouncer se llama **Supavisor (Pooler)**.

* **Aplicación Práctica:** En el panel de Supabase, en la sección de conexión de base de datos, no uses la conexión directa (la que termina en el puerto 5432). Copia la conexión que dice **"Connection Pooler"** (suele terminar en el puerto 6543\) y pégala en las variables de entorno de Vercel.

### **6.2. Autenticación**

| 1\. Implementación Frontend: Autenticación Simplificada (Next.js)  La experiencia del estudiante debe emular la sencillez de un cajero automático. Mediante una interfaz de solo dos campos, el sistema gestiona la complejidad de fondo. Se presenta el componente de React/Next.js optimizado para este flujo: ``import { useState } from 'react'; import { supabase } from '@/lib/supabaseClient';  export default function LoginGuardianes() {   const [alias, setAlias] = useState('');   const [pin, setPin] = useState('');   const [cargando, setCargando] = useState(false);   const iniciarSesion = async (e) => {     e.preventDefault();     setCargando(true);     const aliasLimpio = alias.trim().toLowerCase();     const correoFantasma = `${aliasLimpio}@guardianes.local`;     const { data, error } = await supabase.auth.signInWithPassword({       email: correoFantasma,       password: pin,     });     if (error) {       alert("Credenciales incorrectas. Verifique su Alias y PIN.");       setCargando(false);       return;     }     alert(`¡Acceso concedido, ${aliasLimpio}!`);   };   return (     <div className="contenedor-login">       <h2>Ingreso de Equipos</h2>       <form onSubmit={iniciarSesion}>         <label>Alias de Jugador</label>         <input type="text" value={alias} onChange={(e) => setAlias(e.target.value)} required />         <label>PIN Secreto</label>         <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} required />         <button type="submit" disabled={cargando}>{cargando ? 'Validando...' : 'Entrar'}</button>       </form>     </div>   ); }``  \--- 2\. Estrategia Backend: Automatización de Carga Masiva (CSV a Supabase)  Dada la escala del evento, el registro manual es inviable. Para garantizar la seguridad criptográfica de las contraseñas, utilizaremos un script de Node.js con privilegios de administrador (*service\_role*). 2.1 Preparación del Origen de Datos (CSV)  Debe estructurarse un archivo *alumnos.csv* que incluya los identificadores únicos (UUID) correspondientes a cada institución y equipo: `alias,nombre,apellidos,pin,role_id,school_id,team_id juan_perez,Juan,Perez,4021,uuid-rol,uuid-colegio,1 maria_gomez,Maria,Gomez,8832,uuid-rol,uuid-colegio,1`  2.2 Script de Ingesta Automatizada  Tras inicializar el entorno con las librerías necesarias (*supabase-js, csv-parser*), se despliega el siguiente motor de importación: ``const fs = require('fs'); const csv = require('csv-parser'); const { createClient } = require('@supabase/supabase-js'); const supabase = createClient('URL', 'SERVICE_ROLE_KEY'); async function importarAlumnos() {   fs.createReadStream('alumnos.csv').pipe(csv()).on('data', async (row) => {     const correoFantasma = `${row.alias.toLowerCase()}@guardianes.local`;     try {       const { data: auth, error: aErr } = await supabase.auth.admin.createUser({         email: correoFantasma, password: row.pin, email_confirm: true       });       if (aErr) throw aErr;       const { error: dbErr } = await supabase.from('usuarios').insert([{         id: auth.user.id, alias: row.alias.toLowerCase(), nombre: row.nombre,         school_id: row.school_id, team_id: row.team_id       }]);       if (dbErr) throw dbErr;       console.log(`✅ Registrado: ${row.alias}`);     } catch (e) { console.error(`❌ Fallo: ${row.alias}`, e.message); }   }); } importarAlumnos();``  Para ejecutar la migración, utilice el comando *node importador.js* en su terminal local. Este procedimiento automatizado procesa cada registro, genera la identidad digital invisible (*alias@guardianes.local*), cifra los PIN de seguridad y vincula a los participantes con sus respectivos colegios en la base de datos de producción. Esta arquitectura permite el despliegue de miles de perfiles de usuario para los 16 colegios participantes con una eficiencia operativa total. |
| :---- |

### **6.3. Optimización de Mapbox (La Cortina Invisible)**

**El Problema:** Mapbox permite 50,000 cargas de mapa gratuitas. En programación web, si un alumno cambia de la pestaña "Mapa" a "Mi Perfil" y luego regresa, el programa suele "destruir" y "volver a construir" el mapa, consumiendo una nueva carga. Si miles de alumnos hacen esto varias veces, el mapa gratuito se agotará a la mitad del evento y la pantalla quedará en negro.  
**La Solución Explicada:** En lugar de destruir y reconstruir el mapa, simplemente le pondremos una **cortina invisible** por encima cuando el alumno no lo esté mirando.

* **Aplicación Práctica:** Los desarrolladores deben usar CSS (estilos visuales) para ocultar el mapa. Cuando el alumno va a su perfil, el componente del mapa se oculta (display: none;). Cuando regresa, se vuelve a mostrar (display: block;). Como el mapa nunca se borró realmente, Mapbox contará todo como **1 sola carga** durante toda la expedición de ese alumno.

### **6.4. Monitoreo de Errores con Sentry (La Caja Negra)**

**El Problema:** Diseñamos la web asumiendo que todo funciona perfecto en modo offline. Pero, ¿qué pasa si en un celular Android muy antiguo hay un error de código y la pantalla se queda en blanco? Los organizadores en su central no se enterarían de que ese equipo no puede jugar.  
**La Solución Explicada:** Instalar un sistema llamado **Sentry**, que funciona exactamente como la "caja negra" de un avión. Registra en silencio todo lo que ocurre.

* **Aplicación Práctica:** Se instala una librería ligera en el código fuente de Next.js. Si el celular de un alumno falla, Sentry envía un mensaje automático y silencioso al equipo de desarrollo diciendo: *"Error a las 11:30 AM en un Samsung Galaxy A10 del Equipo Azul: falló el botón de la cámara"*. Esto permite al equipo técnico solucionar el problema mientras la competencia continúa.
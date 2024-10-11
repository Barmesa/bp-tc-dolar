/**
 * Obtiene los datos XML de la URL proporcionada.
 * @returns {Promise<string>} Los datos XML en formato de texto.
 */
export async function getxml() {
	try {
		// Realizamos una solicitud para obtener los datos XML de la URL proporcionada
		// y configuramos el tiempo de vida en caché de la respuesta a 1 hora
		const inicio = Date.now();
		console.log("Iniciando fetch XML... " + inicio);
		const xml = await fetch('https://www.dof.gob.mx/indicadores.xml');
		const fin = Date.now();
		console.log("Fetch XML completado... " + fin);
		if (!xml.ok) {
			// Si la solicitud falla, lanzamos un error
			console.error(`Error obteniendo los datos XML despues de ${fin-inicio} ms`);
			throw new Error(`Failed to fetch XML data ${xml.status} - ${xml.statusText}`);
		}
		console.log(`Datos XML obtenidos exitosamente en ${fin-inicio} ms`);
		return await xml.text(); // Convertimos los datos XML en texto
	} catch (error) {
		// Si ocurre un error, lo imprimimos en la consola
		console.error(error); // y devolvemos una cadena vacía
		return '';
	}
}

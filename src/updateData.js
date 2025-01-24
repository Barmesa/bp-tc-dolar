/**
 * Actualiza los datos del precio del dólar desde un XML proporcionado.
 * @param {Object} env - Entorno que contiene las configuraciones y métodos necesarios.
 * @returns {Object} - Objeto con el estado de la operación y el motivo.
 */
export async function updateData(env) {
    // Obtiene el precio mínimo permitido desde el entorno y lo convierte a un número con 4 decimales
    const precioMinimoPermitido = Number(await env.tc.get("precioMinimoPermitido", { cacheTtl: 3600 })).toFixed(4);
    console.log(`Precio minimo permitido: ${precioMinimoPermitido}`);

    // Importación dinámica de la función getxml
    const { getxml } = await import("./getxml");

    // Intentamos obtener los datos XML de la URL proporcionada
    const xmlText = await getxml();

    // Definimos las etiquetas de inicio y fin para extraer el valor del dólar y la fecha
    const itemEndTag = '</item>';
    const descriptionStartTag = '<description>';
    const descriptionEndTag = '</description>';
    const pubDateStartTag = '<pubDate>';
    const pubDateEndTag = '</pubDate>';

    // Buscamos el índice de la primera ocurrencia de la etiqueta de inicio del ítem
    const startIndex = xmlText.indexOf('<title>DOLAR');
    const endIndex = xmlText.indexOf(itemEndTag, startIndex);

    if (startIndex === -1 || endIndex === -1) {
        console.warn('No se encontró el valor del dólar en el XML del DOF, Omitiendo... y finalizando la ejecución.');
        return { status: 'no ok', reason: 'No se encontró el valor del dólar en el XML del DOF' }; // Si no se encuentra el valor del dólar, se finaliza la ejecución
    }

    // El precio del dólar se encuentra entre las etiquetas de descripción asi que lo extraemos y lo convertimos a un número
    const itemContent = xmlText.substring(startIndex, endIndex + itemEndTag.length);
    const descriptionStartIndex = itemContent.indexOf(descriptionStartTag) + descriptionStartTag.length;
    const descriptionEndIndex = itemContent.indexOf(descriptionEndTag, descriptionStartIndex);
    const valorDolar = Number(itemContent.substring(descriptionStartIndex, descriptionEndIndex)).toFixed(4);

    const pubDateStartIndex = itemContent.indexOf(pubDateStartTag) + pubDateStartTag.length;
    const pubDateEndIndex = itemContent.indexOf(pubDateEndTag, pubDateStartIndex);

    // Importación dinámica de la función getDateBP
    const { getDateBP } = await import("./getDateBP");
    const fechaDolar = getDateBP(itemContent.substring(pubDateStartIndex, pubDateEndIndex));

    // Importación dinámica de la función saveDolar
    const { saveDolar } = await import("./saveDolar");

    if (valorDolar < precioMinimoPermitido) {
        console.warn(`El valor del dólar ${valorDolar} es menor al precio mínimo permitido, Enviando fecha y precio minimo`);
        await saveDolar(env, precioMinimoPermitido, fechaDolar);
        return { status: 'no ok', reason: `El valor del dólar ${valorDolar} es menor al precio mínimo permitido` };
    }

    console.log(`Guardando valor del dolar: ${valorDolar} con fecha: ${fechaDolar}`);
    await saveDolar(env, valorDolar, fechaDolar);
    return { status: 'ok', price: valorDolar };
}

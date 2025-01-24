/**
 * Módulo principal que exporta un objeto con dos funciones asincrónicas: fetch y scheduled.
 * La función fetch se encarga de manejar las solicitudes GET a la ruta "/MX/tc_barmesa/_tipo-de-cambio.html".
 * La función scheduled se ejecuta periódicamente y realiza la obtención y procesamiento de datos del dólar.
 *
 * @module index
 */

export default {
	// #region función fetch (manejo de solicitudes GET)
	/**
	 * Función asincrónica que maneja las solicitudes GET a la ruta "/MX/tc_barmesa/_tipo-de-cambio.html".
	 * Realiza validaciones de la solicitud y obtiene el valor del dólar guardado en la caché.
	 * Luego, devuelve una respuesta con el valor del dólar.
	 *
	 * @param {Request} request - La solicitud HTTP recibida.
	 * @param {Object} env - El entorno de ejecución.
	 * @param {Object} ctx - El contexto de ejecución.
	 * @returns {Promise<Response>} - La respuesta HTTP con el valor del dólar.
	 */
	async fetch(request, env, ctx) {
		// #region Validaciones de la solicitud
		/** Se verifica que el método de la solicitud sea GET
		 * y que la ruta sea "/MX/tc_barmesa/_tipo-de-cambio.html".
		 * Si no cumple con las validaciones, se devuelve una respuesta
		 * con el código de estado correspondiente.
		 */
		const url = new URL(request.url);
		if (request.method !== "GET") {
			console.warn("Método no permitido");
			return new Response("Método no permitido", { status: 405 });
		}
		const data = JSON.parse( await env.tc.get("data", { cacheTtl: 3600}) );
		if(request.headers.get("If-Modified-Since") != null){
			console.log("Solicitud con If-Modified-Since");
			const kVUltAct = data.ultimaAct;
			const fecha = new Date(kVUltAct);
			const fechaMod = new Date(request.headers.get("If-Modified-Since"));
			if(fecha.getTime() <= fechaMod.getTime()){
				console.log("Sin cambios");
				return new Response(null, { status: 304, headers: {'Vary': 'Accept-Encoding','Cache-Control': 'no-store',} });
			}
		}
		if (url.pathname !== "/MX/tc_barmesa/_tipo-de-cambio.html") {
			if(url.pathname == "/" || url.pathname == "" || url.pathname == "/MX/tc_barmesa/_tipo-de-cambio"){
				console.log("Redireccionando a /MX/tc_barmesa/_tipo-de-cambio.html");
				if(url.port == ""){
					return Response.redirect(`${url.protocol}${url.hostname}/MX/tc_barmesa/_tipo-de-cambio.html`, 302);
				}else{
					return Response.redirect(`${url.protocol}${url.hostname}:${url.port}/MX/tc_barmesa/_tipo-de-cambio.html`, 302);
				}
			}
			if (url.pathname == "/MX/tc_barmesa/_tipo-de-cambio.json"){
				return Response.json(data);
			}
			if(url.pathname == "/favicon.ico"){
				const fav = await env.tc.get("favicon", { cacheTtl: 3600, type: "stream"});
				return new Response(fav, { headers: { "Content-Type": "image/png" } });
			}
			// Se verifica si la ruta es "/actualizar" para actualizar los datos del dólar de forma manual en caso de ser necesario
			if (url.pathname == "/actualizar") {
				const { updateData } = await import("./updateData"); // Importación dinámica de la función updateData
				const resultado = await updateData(env);

				if (resultado.status === 'ok') {
					return new Response(`Datos actualizados: Precio del dólar ${resultado.price}`, { status: 200 });
				} else {
					return new Response(`Error al actualizar datos: ${resultado.reason}`, { status: 500 });
				}
			}
			console.warn("URL no permitida");
			return new Response("URL no permitida", { status: 403 });
		}
		// #endregion

		// Se obtiene el valor del dólar guardado en la caché
		// y se devuelve una respuesta con el valor del dólar y la fecha
		const {respuestatc} = await import("./respuestatc"); // Importación dinámica de la función respuestatc
		return respuestatc(data);
	},
	// #endregion

	// #region función scheduled (obtención y procesamiento de datos del dólar)
	/**
	 * Función asincrónica que se ejecuta periódicamente y realiza la obtención y procesamiento de datos del dólar.
	 * Obtiene el valor mínimo permitido del dólar guardado en la caché.
	 * Luego, obtiene el XML del DOF y extrae el valor y la fecha del dólar.
	 * Si el valor del dólar es menor al mínimo permitido, guarda el mínimo permitido y la fecha en la caché.
	 * Si el valor del dólar es mayor o igual al mínimo permitido, guarda el valor y la fecha en la caché.
	 *
	 * @param {Event} event - El evento programado.
	 * @param {Object} env - El entorno de ejecución.
	 * @param {Object} ctx - El contexto de ejecución.
	 */
	async scheduled(event, env, ctx) {
		const { updateData } = await import("./updateData"); // Importación dinámica de la función updateData
		const resultado = await updateData(env);

		if (resultado.status === 'ok') {
			console.log(`Datos actualizados: Precio del dólar ${resultado.price}`);
		} else {
			console.error(`Error al actualizar datos: ${resultado.reason}`);
		}
	},
	// #endregion
};

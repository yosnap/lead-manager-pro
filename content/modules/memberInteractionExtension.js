// Actualización para el módulo de interacción con miembros para integrar historial

// Esta es una extensión del módulo MemberInteraction para agregar funcionalidad de historial
// Debe ser incluido después de memberInteraction.js en el manifest

(() => {
  // Obtener la clase MemberInteraction actual
  const originalMemberInteraction = window.leadManagerPro.memberInteraction;
  
  if (!originalMemberInteraction) {
    console.error('MemberInteractionExtension: No se encontró el módulo de interacción base');
    return;
  }
  
  // Extender los métodos necesarios para integrar el historial
  
  // 1. Extender el método startInteraction para soportar continuación desde el último índice
  const originalStartInteraction = originalMemberInteraction.startInteraction;
  originalMemberInteraction.startInteraction = async function(callback, options = {}) {
    // Cargar el historial
    const interactionHistory = window.leadManagerPro.interactionHistory;
    if (!interactionHistory) {
      console.warn('No se encontró el módulo de historial, continuando sin historial');
      return originalStartInteraction.call(this, callback);
    }
    
    // Obtener ID del grupo actual
    const groupId = this.extractGroupIdFromUrl();
    
    // Obtener configuración de historial si está disponible
    let startFromIndex = 0;
    let continueFromLast = true;
    
    if (options && typeof options.continueFromLast !== 'undefined') {
      continueFromLast = options.continueFromLast;
    }
    
    if (continueFromLast) {
      // Obtener el último índice procesado para este grupo
      const lastIndex = await interactionHistory.getLastInteractionIndex(groupId);
      startFromIndex = lastIndex;
      console.log(`Continuando desde el índice ${startFromIndex} según historial`);
    }
    
    // Guardar el índice inicial para el callback
    this.startFromIndex = startFromIndex;
    
    // Modificar el índice de inicio si estamos continuando desde un punto anterior
    this.currentMemberIndex = startFromIndex;
    
    // Iniciar la interacción con un wrapper para el callback original
    return originalStartInteraction.call(this, async (progress) => {
      // Primero, actualizar el índice real considerando el desplazamiento
      if (progress.type === 'progress') {
        progress.actualMemberIndex = progress.memberIndex + startFromIndex;
      }
      
      // Registrar la interacción en el historial si se envió un mensaje
      if (progress.type === 'progress' && progress.messageSent) {
        try {
          // Generar un ID único para esta interacción
          const interactionId = `${groupId}-${Date.now()}-${progress.actualMemberIndex}`;
          
          // Obtener información del miembro
          const memberElement = progress.memberElement;
          const memberName = this.extractMemberName(memberElement);
          
          // Buscar el enlace del perfil para extraer el userId
          const profileLink = memberElement.querySelector('a[href*="/user/"], a[href*="/profile.php"]');
          const userId = profileLink ? this.extractUserIdFromLink(profileLink) : null;
          
          // Seleccionar un mensaje aleatorio del array de mensajes
          const messageIndex = Math.floor(Math.random() * this.messages.length);
          const messageText = this.messages[messageIndex] || this.messageToSend;
          
          // Registrar la interacción en el historial
          await interactionHistory.registerInteraction(groupId, {
            userId: userId || 'unknown',
            userName: memberName,
            messageText: messageText,
            interactionId: interactionId,
            index: progress.actualMemberIndex + 1 // Guardar el siguiente índice
          });
        } catch (error) {
          console.error('Error al registrar interacción en el historial:', error);
        }
      }
      
      // Llamar al callback original
      if (callback) {
        callback(progress);
      }
    });
  };
  
  // 2. Agregar un método para obtener el índice de inicio actual
  originalMemberInteraction.getStartFromIndex = function() {
    return this.startFromIndex || 0;
  };
  
  console.log('MemberInteractionExtension: Extendido correctamente');
})();

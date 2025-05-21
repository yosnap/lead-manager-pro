// Mejora para el módulo de interacción con miembros para soportar mensajes aleatorios
// Este archivo debe ser incluido después de memberInteraction.js 

window.addEventListener('DOMContentLoaded', () => {
  // Esperar a que se inicialice el módulo de interacción con miembros
  const waitForInitialization = setInterval(() => {
    if (window.leadManagerPro && window.leadManagerPro.memberInteraction) {
      clearInterval(waitForInitialization);
      
      console.log('Mejorando el módulo de interacción con miembros para soportar mensajes aleatorios...');
      
      // Obtener la instancia del módulo de interacción
      const memberInteraction = window.leadManagerPro.memberInteraction;
      
      // Guardar una referencia a la función original de sendMessage
      const originalSendMessage = memberInteraction.sendMessage;
      
      // Reemplazar la función sendMessage para usar un mensaje aleatorio
      memberInteraction.sendMessage = async function(messageField) {
        try {
          // Seleccionar un mensaje aleatorio de la lista de mensajes
          let messageToSend = this.messageToSend;
          this.lastSentMessageIndex = 0; // Por defecto usar el primer mensaje
          
          if (Array.isArray(this.messages) && this.messages.length > 0) {
            // Seleccionar un índice aleatorio
            const randomIndex = Math.floor(Math.random() * this.messages.length);
            messageToSend = this.messages[randomIndex];
            this.lastSentMessageIndex = randomIndex;
            
            console.log(`Usando mensaje aleatorio (${randomIndex + 1}/${this.messages.length}): "${messageToSend.substring(0, 30)}..."`);
          } else {
            console.log('No hay múltiples mensajes disponibles, usando mensaje predeterminado');
          }
          
          // Guardar el mensaje original
          const originalMessage = this.messageToSend;
          
          // Aplicar el mensaje aleatorio temporalmente
          this.messageToSend = messageToSend;
          
          // Llamar a la función original
          const result = await originalSendMessage.call(this, messageField);
          
          // Restaurar el mensaje original (para compatibilidad)
          this.messageToSend = originalMessage;
          
          return result;
        } catch (error) {
          console.error('Error al enviar mensaje aleatorio:', error);
          return false;
        }
      };
      
      // Si no tiene un array de mensajes, crear uno
      if (!Array.isArray(memberInteraction.messages)) {
        memberInteraction.messages = [memberInteraction.messageToSend];
      }
      
      console.log('Módulo de interacción con miembros mejorado para soportar mensajes aleatorios');
    }
  }, 1000);
});
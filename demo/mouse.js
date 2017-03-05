/**
 * Создает новый экземпляр mouse.
 * 
 * @param {any} element DOM-объект для привязки. 
 */
var Mouse = function(element) {
    this.position = new Point();

    element.addEventListener('mousemove', (function(evt) {
        var rect = element.getBoundingClientRect();
        this.position.x = evt.clientX - rect.left;
        this.position.y = evt.clientY - rect.top;
    }).bind(this));
}
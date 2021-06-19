
import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import saveSign from '@salesforce/apex/ImageHelper.saveImage';

//declaration of variables for calculations
let isDownFlag, 
    isDotFlag = false,
    prevX = 0,
    currX = 0,
    prevY = 0,
    currY = 0;            
       
let x = "#000000"; //black color
let y = 1.5; //weight of line width and dot.       

let attachment; //holds attachment information after saving the sigture on canvas
let dataURL,convertedDataURI; //holds image data

export default class DrawImageCmp extends LightningElement {

    canvasElement;
    ctx;

    //event listeners added for drawing the signature within shadow boundary
    constructor() {
        super();
        this.template.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.template.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.template.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.template.addEventListener('mouseout', this.handleMouseOut.bind(this));
    }

    connectedCallback() {
    }

    renderedCallback() {
        this.canvasElement = this.template.querySelector('canvas');
        this.ctx = this.canvasElement.getContext("2d");
    }

    //handler for mouse move operation
    handleMouseMove(event){
        this.searchCoordinatesForEvent('move', event);      
    }
    
    //handler for mouse down operation
    handleMouseDown(event){
        this.searchCoordinatesForEvent('down', event);         
    }
    
    //handler for mouse up operation
    handleMouseUp(event){
        this.searchCoordinatesForEvent('up', event);       
    }

    //handler for mouse out operation
    handleMouseOut(event){
        this.searchCoordinatesForEvent('out', event);         
    }
    
    /*
        handler to perform save operation.
        save signature as attachment.
        after saving shows success or failure message as toast
    */
    handleSaveClick(){    
        //set to draw behind current content
        this.ctx.globalCompositeOperation = "destination-over";
        this.ctx.fillStyle = "#FFF"; //white
        this.ctx.fillRect(0,0, this.canvasElement.width, this.canvasElement.height); 

        //convert to png image as dataURL
        dataURL = this.canvasElement.toDataURL("image/png");
        //convert that as base64 encoding
        convertedDataURI = dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
        
        //call Apex method imperatively and use promise for handling sucess & failure
        saveImage({strSignElement: convertedDataURI, recId : 'your-record-id'})
            .then(result => {
               
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Image saved.',
                        variant: 'success',
                    }),
                );
            })
            .catch(error => {
                //show error message
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating Salesforce File record',
                        message: error.body.message,
                        variant: 'error',
                    }),
                );
            });
            
    }

    //clear the signature from canvas
    handleClearClick(){
        this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);          
    }

    searchCoordinatesForEvent(requestedEvent, event){
        event.preventDefault();
        if (requestedEvent === 'down') {
            this.setupCoordinate(event);           
            isDownFlag = true;
            isDotFlag = true;
            if (isDotFlag) {
                this.drawDot();
                isDotFlag = false;
            }
        }
        if (requestedEvent === 'up' || requestedEvent === "out") {
            isDownFlag = false;
        }
        if (requestedEvent === 'move') {
            if (isDownFlag) {
                this.setupCoordinate(event);
                this.redraw();
            }
        }
    }

    //This method is primary called from mouse down & move to setup cordinates.
    setupCoordinate(eventParam){
        //get size of an element and its position relative to the viewport 
        //using getBoundingClientRect which returns left, top, right, bottom, x, y, width, height.
        const clientRect = this.canvasElement.getBoundingClientRect();
        prevX = currX;
        prevY = currY;
        currX = eventParam.clientX -  clientRect.left;
        currY = eventParam.clientY - clientRect.top;
    }

    //For every mouse move based on the coordinates line to redrawn
    redraw() {
        this.ctx.beginPath();
        this.ctx.moveTo(prevX, prevY);
        this.ctx.lineTo(currX, currY);
        this.ctx.strokeStyle = x; //sets the color, gradient and pattern of stroke
        this.ctx.lineWidth = y;        
        this.ctx.closePath(); //create a path from current point to starting point
        this.ctx.stroke(); //draws the path
    }
    
    //this draws the dot
    drawDot(){
        this.ctx.beginPath();
        this.ctx.fillStyle = x; //blue color
        this.ctx.fillRect(currX, currY, y, y); //fill rectrangle with coordinates
        this.ctx.closePath();
    }
}
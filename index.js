(function() {
	var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext('2d');

	var textCanvas = document.getElementById('text-canvas');
	var textCtx = textCanvas.getContext('2d');

	var maskCanvas = document.getElementById('text-mask-canvas');
	var maskCtx = maskCanvas.getContext('2d');

	var canvasWidth = 640;
	var canvasHeight = 640;
	var textWidth = 400;
	var textHeight = 200;

	var imageInput = document.getElementById("file-input");
	var colorInput = document.getElementById("back-color-input");
	var overlayInput = document.getElementById("overlay-input");
	var textInput = document.getElementById("text-input");
	var textSizeInput = document.getElementById("text-size-input");
	var textColorInput = document.getElementById("text-color-input");
	var textOpacityInput = document.getElementById("text-opacity-input");
	var saveButton = document.getElementById("save-button");
	var lightbox = document.getElementById("lightbox");
	var closeButton = document.getElementById("close-button");
	var result = document.getElementById("result");

	var img = new Image();

	var context = {
		backgroundColor : "#dad3b6",
		fileName: "",
		text: "Watermark Text",
		textHighlightColor: "#ffffff",
		textShadowColor: "#000000",
		textOpacity: 1,
		textX: canvasWidth / 2,
		textY: canvasHeight / 2,
		textSize: 30
	};

	function prepareWatermark() {	
		var fontSize = context.textSize;
		var width = textWidth;
		var height = textHeight;
		var text = context.text;

		maskCtx.fillStyle = "#fff";
		maskCtx.font = fontSize + "px sans-serif";
		maskCtx.fillRect(0, 0, width, height);

		var textSize = maskCtx.measureText(text);
		maskCtx.fillStyle = "#000";
		maskCtx.fillText(text,
			width / 2 - textSize.width / 2,
			height / 2 + fontSize /2);


		var idata = maskCtx.getImageData(0, 0, width, height);
		var data32 = new Uint32Array(idata.data.buffer);
		var i = 0, len = data32.length;
		while(i < len) {
			data32[i] = data32[i++] << 8;
		} 
		maskCtx.putImageData(idata, 0, 0);

		var textSize = maskCtx.measureText(text);
		textCtx.font = fontSize + "px sans-serif";

		textCtx.fillStyle = context.textHighlightColor;
		textCtx.fillText(text,
			width / 2 - textSize.width / 2 - 1,
			height / 2 + fontSize / 2 - 1);
		textCtx.fillStyle = context.textShadowColor;
		textCtx.fillText(text,
			width / 2 - textSize.width / 2 + 1,
			height / 2 + fontSize / 2 + 1);

		maskCtx.globalCompositeOperation = "source-in";
		maskCtx.globalAlpha = context.textOpacity;
		maskCtx.drawImage(textCanvas, 0, 0);
	}

	function renderBackground() {
		ctx.fillStyle = context.backgroundColor;
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);
	}

	function renderImage() {
		var vPad = 32;
		var hPad = 32;
		var dstWidth = canvasWidth - hPad * 2;
		var dstHeight = canvasHeight - vPad * 2;
		var srcRatio = img.width / img.height;
		var dstRatio = dstWidth / dstHeight;

	    var scaleFactor;
	    if (srcRatio < dstRatio)
	        scaleFactor = dstHeight / img.height;
	    else
	        scaleFactor = dstWidth / img.width;

	    var totalWidth = img.width * scaleFactor;
	    var totalHeight = img.height * scaleFactor;

	    ctx.drawImage(img,
		    hPad + (dstWidth - totalWidth) / 2,
		    vPad + (dstHeight - totalHeight) / 2,
		    img.width * scaleFactor,
		    img.height * scaleFactor);
	}

	function renderWatermark() {
		ctx.drawImage(maskCanvas, context.textX - textWidth / 2,
		 context.textY - textHeight / 2);
	}

	function render() {
		renderBackground();
		renderImage();			
		renderWatermark();
	}

	function onCanvasGesture(e) {
		context.textX = e.offsetX;
		context.textY = e.offsetY;
	}

	new Binding(context, "textX")
		.observe(render);

	new Binding(context, "textY")
		.observe(render);

	var dragging = false;

	canvas.addEventListener("touchstart", () => {
		dragging = true;
	}, false);

	canvas.addEventListener("touchmove", (e) => {
		if(dragging) {
			var offset = e.target.getBoundingClientRect();
			context.textX = e.touches[0].pageX - offset.left;
			context.textY = e.touches[0].pageY - offset.top;
			e.preventDefault();
			e.stopPropagation();
		}
	}, false);

	canvas.addEventListener("touchend", () => {
		dragging = false;
	}, false);

	imageInput.addEventListener("change", function(e) {			
		img.onload = render;
		context.fileName = e.target.files[0].name;
		img.src = URL.createObjectURL(e.target.files[0]);
	});


	closeButton.addEventListener("click", function () {
		lightbox.style.display = "none";
	});

	saveButton.addEventListener("click", function () {
		lightbox.style.display = "block";
		result.src = canvas.toDataURL("image/png");
	});

	new Binding(context, "text")
		.bindDOM(textInput, "value", "input")
		.observe(() => {
			prepareWatermark();
			render();
		});
		
	new Binding(context, "textSize")
		.bindDOM(textSizeInput, "value", "input")
		.observe(() => {
			prepareWatermark();
			render();
		});
		
	new Binding(context, "textColor")
		.bindDOM(textColorInput, "value", "input")
		.observe(() => {
			prepareWatermark();
			render();
		});
		
	new Binding(context, "textOpacity")
		.bindDOM(textOpacityInput, "value", "input")
		.observe(() => {
			prepareWatermark();
			render();
		});

	new Binding(context, "backgroundColor")
		.bindDOM(colorInput, "value", "input")
		.observe(render);

	prepareWatermark();
	render();

}());
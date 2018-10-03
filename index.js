(function() {
	var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext('2d');

	var textCanvas = document.getElementById('text-canvas');
	var textCtx = textCanvas.getContext('2d');

	var maskCanvas = document.getElementById('text-mask-canvas');
	var maskCtx = maskCanvas.getContext('2d');

	var defaultCanvasSize = 1024;
	var canvasWidth = defaultCanvasSize;
	var canvasHeight = defaultCanvasSize;
	var textWidth = 1024;
	var textHeight = 1024;

	var imageInput = document.getElementById("file-input");
	var colorInput = document.getElementById("back-color-input");
	var overlayInput = document.getElementById("overlay-input");
	var textInput = document.getElementById("text-input");
	var textSizeInput = document.getElementById("text-size-input");
	var textOpacityInput = document.getElementById("text-opacity-input");
	var saveButton = document.getElementById("save-button");
	var lightbox = document.getElementById("lightbox");
	var closeButton = document.getElementById("close-button");
	var result = document.getElementById("result");
	var coverInput = document.getElementById("cover-option");
	var containInput = document.getElementById("contain-option");
	var preserveInput = document.getElementById("preserve-option");
	var paddingInput = document.getElementById("padding-input");

	var img = new Image();

	var context = {
		backgroundColor : "#dad3b6",
		fileName: "",
		text: "Watermark Text",
		textHighlightColor: "#ffffff",
		textShadowColor: "#000000",
		textOpacity: 1,
		textX: .5,
		textY: .5,
		textSize: 30,
		padding: 10,
		fillType: "contain"
	};

	function prepareWatermark() {	
		var fontSize = context.textSize;
		var width = textWidth;
		var height = textHeight;
		var text = context.text;

		maskCtx.fillStyle = "#ffffff";
		maskCtx.font = fontSize + "px sans-serif";
		maskCtx.fillRect(0, 0, width, height);

		var textSize = maskCtx.measureText(text);
		maskCtx.fillStyle = "#000000";
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
		textCtx.clearRect(0, 0, textWidth, textHeight);

		textCtx.fillStyle = context.textHighlightColor;
		textCtx.fillText(text,
			width / 2 - textSize.width / 2 - 1,
			height / 2 + fontSize / 2 - 1);
		textCtx.fillStyle = context.textShadowColor;
		textCtx.fillText(text,
			width / 2 - textSize.width / 2 + 1,
			height / 2 + fontSize / 2 + 1);

		var tmp = maskCtx.globalCompositeOperation;
		maskCtx.globalCompositeOperation = "source-in";
		maskCtx.drawImage(textCanvas, 0, 0);
		maskCtx.globalCompositeOperation = tmp;
	}

	function renderImage() {
		var srcRatio = img.width / img.height;

		if(context.fillType !== "preserve" || !img.width || !img.height) {
			canvasWidth = canvasHeight = defaultCanvasSize;
		} else {
			if(srcRatio < 1) {
				canvasHeight = defaultCanvasSize;
				canvasWidth = canvasHeight * srcRatio;
			} else {
				canvasWidth = defaultCanvasSize;
				canvasHeight = canvasWidth / srcRatio;
			}
		}

		canvas.width = canvasWidth;
		canvas.height = canvasHeight;

		ctx.fillStyle = context.backgroundColor;
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		var vPad = context.padding;
		var hPad = context.padding;
		var dstWidth = canvasWidth - hPad * 2;
		var dstHeight = canvasHeight - vPad * 2;
		
		var dstRatio = dstWidth / dstHeight;

	    var scaleFactor;
	    if (srcRatio < dstRatio && context.fillType === "contain"
	    	|| srcRatio > dstRatio && context.fillType === "cover")
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
		ctx.globalAlpha = context.textOpacity;
		ctx.drawImage(maskCanvas, 
			context.textX * canvasWidth - textWidth / 2,
		 	context.textY * canvasHeight - textHeight / 2);
		ctx.globalAlpha = 1;
	}

	function render() {
		renderImage();			
		renderWatermark();
	}

	new Binding(context, "textX")
		.observe(render)
		.store();

	new Binding(context, "textY")
		.observe(render)
		.store();

	var dragging = false;
	var dragStartEvent = "mousedown";
	var dragMoveEvent = "mousemove";
	var dragEndEvent = "mouseup";
	var isTouch = "ontouchstart" in document.documentElement;

	if(isTouch) {
		dragStartEvent = "touchstart";
		dragMoveEvent = "touchmove";
		dragEndEvent = "touchend";
	}

	canvas.addEventListener(dragStartEvent, function() {
		dragging = true;
	}, false);

	canvas.addEventListener(dragMoveEvent, function(e) {
		if(dragging) {
			var offset = e.target.getBoundingClientRect();
			if(isTouch) {
				context.textX = (e.touches[0].clientX - offset.left) / offset.width;
				context.textY = (e.touches[0].clientY - offset.top) / offset.height;
			} else {
				context.textX = (e.clientX - offset.left) / offset.width;
				context.textY = (e.clientY - offset.top) / offset.height;
			}
			e.preventDefault();
			e.stopPropagation();
		}
	}, false);

	canvas.addEventListener(dragEndEvent, function() {
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
		.observe(function() {
			prepareWatermark();
			render();
		})
		.store();

	containInput.addEventListener("change", function() {
		context.fillType = "contain";
		context.padding = 10;
	});

	coverInput.addEventListener("change", function() {
		context.fillType = "cover";
		context.padding = 0;
	});

	preserveInput.addEventListener("change", function() {
		context.fillType = "preserve";
		context.padding = 0;
	});

	new Binding(context, "fillType")
		.observe(function() {
			if(context.fillType == "contain") {
				containInput.parentElement.classList.add("active");
				coverInput.parentElement.classList.remove("active");
				preserveInput.parentElement.classList.remove("active");
				containInput.checked = true;
			} else if(context.fillType == "cover") {
				coverInput.parentElement.classList.add("active");
				containInput.parentElement.classList.remove("active");
				preserveInput.parentElement.classList.remove("active");
				coverInput.checked = true;
			} else if(context.fillType == "preserve") {
				coverInput.parentElement.classList.remove("active");
				containInput.parentElement.classList.remove("active");
				preserveInput.parentElement.classList.add("active");
				preserveInput.checked = true;
			}
			render();
		})
		.store();
		
	new Binding(context, "textSize", "number")
		.bindDOM(textSizeInput, "value", "input")
		.observe(function() {
			prepareWatermark();
			render();
		})
		.store();
		
		
	new Binding(context, "textOpacity", "number")
		.bindDOM(textOpacityInput, "value", "input")
		.observe(function() {
			prepareWatermark();
			render();
		})
		.store();

	new Picker({
		parent: colorInput,
		color: context.backgroundColor,
		popup: false,
		onChange: function(color) {
			context.backgroundColor = color.rgbaString;
		}
	});

	colorInput.addEventListener("click", function(e) { 
		e.preventDefault(); 
	});

	new Binding(context, "backgroundColor")
		.observe(render)
		.store();

	new Binding(context, "padding", "number")
		.bindDOM(paddingInput, "value", "input")
		.observe(render)
		.store();

	prepareWatermark();
	render();

}());
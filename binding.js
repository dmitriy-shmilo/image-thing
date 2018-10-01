function Binding(obj, prop) {
    var self = this;
    self.elementBindings = [];
    self.observers = [];
    self.value = obj[prop];
    
    function valueGetter() {
        return self.value;
    }

    function valueSetter(val) {
        self.value = val
        for (var i = 0; i < self.elementBindings.length; i++) {
            var binding = self.elementBindings[i];
            binding.element[binding.attribute] = val;
        }

        for (var i = 0; i < self.observers.length; i++) {
            var observer = self.observers[i];
            observer();
        }
    }

    self.bindDOM = function(element, attribute, event) {
        var binding = {
            element: element,
            attribute: attribute,
            isNumber: element.type === "number"
        };

        if (event){
            element.addEventListener(event, function(event) {
                var value = element[attribute];
                if(binding.isNumber) {
                    value = parseFloat(value);
                }
                valueSetter(value);
            })
            binding.event = event
        }

        self.elementBindings.push(binding);
        element[attribute] = self.value;
        return self;
    };

    self.observe = function(callback) {
        self.observers.push(callback);
        return self;
    }

    self.store = function () {
        if(localStorage.getItem(prop)) {
            valueSetter(localStorage.getItem(prop));
        }

        self.observe(function () {
            localStorage.setItem(prop, valueGetter());
        });
        return self;
    };

    Object.defineProperty(obj, prop, {
        get: valueGetter,
        set: valueSetter
    }); 

    obj[prop] = self.value;
}
function A(value)                        // Define super class
{
  this.x = value || 1;
}

 
//B.prototype.constructor = B;
function B (value)
{
    //A.call(this);                    // Call super-class constructor (if desired)
    this.y = value || 2;
    
    console.log('constructing', this.x, this.y)
}

B.prototype = new A;                // Define sub-class

 
b = new B;
console.log(b.x, b.y)

b2 = new  B(123)
console.log(b2.x, b2.y)

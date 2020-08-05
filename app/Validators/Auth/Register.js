'use strict'

class AuthRegister {
  get rules () {
    return {
      // validation rules
      name: 'required',
      surname: 'required',
      email: 'required|email|unique:users,email',
      password: 'required!confirmed'
    }
  }

  get messages(){
    return{
      'name.required': 'Name is required',
      'surname.required': 'Last name is required',
      'email.required': 'Email is required',
      'email.unique': 'This email already exists',
      'email.email': 'Invalid email',
      'password.required': 'Password is required',
      'password.confirmed': 'Passwords do not match'
    }
  }
}

module.exports = AuthRegister

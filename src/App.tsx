import React, {useEffect, useState} from 'react';
import axios, {AxiosRequestConfig} from "axios";

// 批量并发请求的时候，只发起一次refresh
interface PendingTask {
  config: AxiosRequestConfig
  resolve: Function
}
let refreshing = false
const queue: PendingTask[] =[]




async function refreshToken() {
  const res = await axios.get(
    'http://localhost:3000/user/refresh', {
      params: {
        refresh_token: localStorage.getItem('refresh_token')
      }
    }

  )
  localStorage.setItem('access_token', res.data.access_token || '')
  localStorage.setItem('refresh_token', res.data.refresh_token|| '')
  return res
}
axios.interceptors.request.use(function (config) {
  const accessToken = localStorage.getItem('access_token')

  if(accessToken) {
    config.headers.authorization = 'Bearer ' + accessToken
  }

  return config
})

axios.interceptors.response.use(
  response => {
    return response
},
  async error => {
    let { data, config} = error.response

    if(refreshing) {
      return new Promise((resolve)=> {
        queue.push({
          config,
          resolve
        })
      })
    }


    if(data.statusCode === 401 && !config.url.includes('/user/refresh')) {
      refreshing = true
      const res = await  refreshToken()
      refreshing = false

      if(res.status === 200) {
        queue.forEach(({config,resolve})=>{
          resolve(axios(config))
        })
        // 执行完成后，清空队列。
        queue.length = 0;

        return axios(config)
      } else {
        alert('登陆过期，请重新登录')
        return Promise.reject(res.data)
      }
    } else {
      return  error.response
    }
  }
)

function App() {

  const [aaa,setAaa] = useState()
  const [bbb,setBbb] = useState()




  async function login() {
    const res = await axios.post(
      'http://localhost:3000/user/login',{
        username: 'wu',
        password: '123456'
      }
    )
    localStorage.setItem('access_token',res.data.access_token)
    localStorage.setItem('refresh_token', res.data.refresh_token)
  }
  async function query() {
    if(!localStorage.getItem('access_token')) {
      await login()
    }
    await [
      axios.get('http://localhost:3000/bbb'),
      axios.get('http://localhost:3000/bbb'),
      axios.get('http://localhost:3000/bbb')
    ];
    const {
      data: aaaData
    } = await axios.get('http://localhost:3000/aaa')

    const {
      data: bbbData
    } = await  axios.get('http://localhost:3000/bbb',{
      // headers: {
      //   Authorization: 'Bearer ' + localStorage.getItem('access_token')
      // }
    })

    setAaa(aaaData)
    setBbb(bbbData)

  }

  useEffect(() => {
    query()
  }, []);
  return (
    <div>
      <p>{aaa}</p>
      <p>{bbb}</p>
    </div>
  );
}

export default App;

// 엄격한 모드
;(function () {
  'use strict'

  //get 함수는 쿼리셀렉터를 편하게 사용할 수 있는 헬퍼 함수
  const get = (target) => {
    return document.querySelector(target)
  }


  //선언부
    const API_URL = 'http://localhost:3000/todos';
    // const todosDom = document.getElementsByClassName('todos')[0];
    // 아래 get 함수를 사용해 쉽게 가져올 수 있다.
    const $todos = get('.todos'); //이걸 쓰려면 get함수가 선언된 다음에 작성해야 한다.
    const $form = get('.todo_form');
    const $input = get('.todo_input');

  //item 이란 이름으로 data를 받아와서 뿌려준다.
  const createTodoElement = (item) => {
    const { id, content, completed } = item
    const isCompleted = completed ? 'checked' : '';
    const $todoItem = document.createElement('div')
    $todoItem.classList.add('item')
    $todoItem.dataset.id = id
    $todoItem.innerHTML = `
            <div class="content">
              <input
                type="checkbox"
                class='todo_checkbox' 
                ${isCompleted}
              />
              <label>${content}</label>
              <input type="text" value="${content}" />
            </div>
            <div class="item_buttons content_buttons">
              <button class="todo_edit_button">
                <i class="far fa-edit"></i>
              </button>
              <button class="todo_remove_button">
                <i class="far fa-trash-alt"></i>
              </button>
            </div>
            <div class="item_buttons edit_buttons">
              <button class="todo_edit_confirm_button">
                <i class="fas fa-check"></i>
              </button>
              <button class="todo_edit_cancel_button">
                <i class="fas fa-times"></i>
              </button>
            </div>
      `
    return $todoItem
  }

  const renderAllTodos = (todos) => {
    $todos.innerHTML = ""; //초기화
    
    //json data에서 원하는 값을 원하는 위치에 넣어주기 위해 forEach로 뿌려준다.
    todos.forEach((item) => {
      const todoItems = createTodoElement(item)
      //뿌릴 준비가 된 데이터를 todoItems라는 변수에 담아서 appendChild로 $todos 으로 만든 html에 붙여준다.
      $todos.appendChild(todoItems)
    })

  }

//todo 목록 불러오기
//getTodos(json data 불러오기) -> renderAllTodos(data 뿌릴 준비) -> createTodoElement(각 todo를 화면에 보여줌)
  const getTodos = () => {
    fetch(API_URL) // fetch('http://localhost:3000/todos') 데이터를 가져오는 URL은 자주 사용하므로 최상단에 선언해주자.
      .then((res) => res.json())
      // .then((todos) => console.log(todos)) 값이 잘 들어옴을 확인. 이제 화면에 뿌려줘야함.
      .then((todos) => renderAllTodos(todos)) //renderAllTodos 라는 이름의 함수를 사용해 화면에 뿌려주자. (위치 : html- class="todos" 내부)
      .catch((error) => console.log(error))
  }

//새로운 todo 추가하기
  const addTodo = (e) => {
    //1. form-submit 이벤트 발생 시 자동으로 새로고침 되는 것을 막는 event.preventDefault
    e.preventDefault();
    //2.input에 입력된 value를 가져온다.
    //console.log($input.value); // 제대로 접근된거면 입력값+버튼 을 누르면 콘솔에 입력값이 보인다.
    //4.body: JSON.stringify(todo)의 {todo 객체} 선언
    const todo = { //id는 자동입력된다.
      "content": $input.value,
      "completed": false,
    }
    //3.잡은 value를 fetch로 서버에 보낸다.
    fetch(API_URL, {
      method: 'POST',
      headers:{
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(todo), // data는 `string` or {object}=>object는 따로 선언해준다.
    }).then(getTodos)//전체 리스트를 다시 불러온다.
    .then(() => {
      $input.value = "" //$input.value를 빈 값으로 바꿔준다.
      $input.focus()
    }).catch((error) => console.log(error))
  }

//5.checkbox 이벤트
//🚨 체크박스 변화 시 자꾸 새로고침 되는 문제 발생 => 아예 새로고침 시 관련 데이터를 들고오게 만들어서 해결
  const toggleTodo = (e) => {
    //$todos 로 addEventListener를 접근하면 todo 목록 어디를 눌러도 이벤트가 동작한다.
    //그러므로 범위를 checkbox로 줄일 필요가 있다.
    //console.log(e.target.className); // 클릭 시 해당 element의 class명을 콘솔에 찍는다. (체크박스는 todo_checkbox)
    if(e.target.className !== 'todo_checkbox') return; //ealry return;

    //이제 수많은 checkbox 중 내가 클릭한게 어떤 건지를 알아야 한다.
    //.closest()를 이용해 가장 가까운 요소를 찾아 접근한 후 좀 더 세밀하게 접근해보자.
    const $item = e.target.closest('.item') // 체크박스와 가장 가까운 class='item'에 접근한 후
    const id = $item.dataset.id // 그 요소의 dataset의 id에 접근한다.
    
    //체크박스의 상태를 가져오자.(false or true)
    const completed = e.target.checked

    //fetch는 endpoint에 id값을 작성하면 해당 id 데이터와 통신할 수 있다.
    fetch(`${API_URL}/${id}`, {
      method: 'PATCH', //PATCH 부분변경
      headers:{
        'Content-Type': 'application/json',
      },
      body:JSON.stringify({ completed })
    }).then(getTodos)
    .catch((error)=> console.log(error))
  }

//6.수정하기 모드 전환
  const changeEditMode = (e) => {
    //각 요소에 접근하기
    const $item = e.target.closest('.item')
    const $label = $item.querySelector('label')
    const $editInput = $item.querySelector('input[type="text"]')//input 태그 중 type이 text인 것
    const $contentButtons = $item.querySelector('.content_buttons')
    const $editButtons = $item.querySelector('.edit_buttons')
    const focusValue = $editInput.value //수정하려는 value
    const existedValue = $label.innerHTML //기존 value

    //내가 클릭한 버튼이 todo_edit_button 일 때 발생할 현상 :: 수정버튼
    if(e.target.className === 'todo_edit_button') {
      $label.style.display = 'none'
      $editInput.style.display = 'block'
      $contentButtons.style.display = 'none'
      $editButtons.style.display = 'block'
      //🚨focus를 주는데! 커서를 맨 뒤로 가게 만들기 위해
      //value를 지웠다가 다시 적게 만든다.
      $editInput.focus()
      $editInput.value = ""
      $editInput.value = focusValue

    };
    //내가 클릭한 버튼이 todo_edit_cancel_button 일 때 발생할 현상 :: 수정취소버튼
    if(e.target.className === 'todo_edit_cancel_button') {
      $label.style.display = 'block'
      $editInput.style.display = 'none'
      $contentButtons.style.display = 'block'
      $editButtons.style.display = 'none'
      //수정하려다 취소하고 다시 수정하기를 누르면 기존 수정하려던 값이 남아있다.
      //기존 value는 label의 innerHTML 과 동일하다.
      //이것도 focus 주는 것처럼 기존 value를 덮어씌워보자
      $editInput.value = ""
      $editInput.value = existedValue

    };
  }

//수정 내역이 반영되는 이벤트 함수
  const editTodo = (e) => {
    //특정 id를 가져와서 특정 id의 콘텐츠만 수정한다.
    if(e.target.className !== 'todo_edit_confirm_button') return;
    
    const $item = e.target.closest('.item')
    const id = $item.dataset.id 
    const $editInput = $item.querySelector('input[type="text"]')
    const content = $editInput.value //🚨

    fetch(`${API_URL}/${id}`, {
      method: 'PATCH', //PATCH 부분변경
      headers:{
        'Content-Type': 'application/json',
      },
      body:JSON.stringify({ content }) //🚨
    }).then(getTodos)
    .catch((error)=> console.log(error))
  }

//todo를 삭제하는 이벤트 함수
  const deleteTodo = (e) => {
    //선택한 todo만 지워야 하므로 id를 가져와 json을 제거하도록 한다.
    if(e.target.className !== 'todo_remove_button') return;
    const $item = e.target.closest('.item') 
    const id = $item.dataset.id

    fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    }).then(getTodos)
    .catch((error)=> console.log(error))
  }

  //바로 실행되도록 사전 제공
  const init = () => {
    //dom tree가 다 만들어진 후에 dom에 접근이 가능하기 때문에, dom이 생성 전 dom을 조작하는 js 코드가 실행되어 원하지 않는 결과를 내는 것을 막을 수 있다.
    window.addEventListener('DOMContentLoaded', () => {
      console.log('DOM fully loaded and parsed111')
      getTodos();
      console.log('DOM fully loaded and parsed222')
    });

    //submit 버튼 클릭시 서버로 input값을 넘기는 이벤트
    $form.addEventListener('submit', addTodo)
  }

    //checkbox 체크 시 'completed'가 false->true로, 해제 시 true->false로 변하는 이벤트
    $todos.addEventListener('click', toggleTodo)

    //수정 버튼 클릭 시 수정모드로 변하는 이벤트
    $todos.addEventListener('click', changeEditMode)

    //수정 모드에서 수정 내역을 반영하는 이벤트
    $todos.addEventListener('click', editTodo)

    //todo 를 삭제하는 이벤트
    $todos.addEventListener('click', deleteTodo)

  init()
})()
